import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TripService } from '../tripService';

// Mock modules
vi.mock('../supabaseClient', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn(),
            maybeSingle: vi.fn()
        })),
        auth: {
            getSession: vi.fn()
        },
        channel: vi.fn(),
        removeChannel: vi.fn()
    }
}));

import { supabase } from '../supabaseClient';

describe('TripService Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    describe('[SECURITY AUDIT] createTrip financial safety', () => {
        it('should NOT call wallet/transaction tables - only trips', async () => {
            const mockTrip = {
                id: 'trip-123',
                passenger_id: 'user-123',
                status: 'REQUESTED',
                origin: 'Point A',
                destination: 'Point B',
                priceUsd: 10,
                priceVes: 100,
                created_at: new Date().toISOString()
            };

            const mockFrom = supabase.from as any;
            mockFrom.mockReturnValue({
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                    data: mockTrip,
                    error: null
                })
            });

            const origin = { address: 'Point A', lat: 10.5, lng: -66.9 };
            const destination = { address: 'Point B', lat: 10.6, lng: -66.8 };

            await TripService.createTrip(
                'user-123',
                origin,
                destination,
                'standard',
                'sedan',
                { usd: 10, ves: 100 },
                5.5,
                false // Don't trigger matching to keep test isolated
            );

            // SECURITY: Verify only 'trips' table is accessed
            expect(supabase.from).toHaveBeenCalledWith('trips');
            expect(supabase.from).toHaveBeenCalledTimes(1);

            // Verify NO calls to financial tables
            expect(supabase.from).not.toHaveBeenCalledWith('wallets');
            expect(supabase.from).not.toHaveBeenCalledWith('wallet_transactions');
            expect(supabase.from).not.toHaveBeenCalledWith('payment_records');
        });

        it('[RISK WARNING] should accept price from client (documented vulnerability)', async () => {
            // THIS IS A KNOWN SECURITY RISK: Price comes from client
            // Recommendation: Migrate to Edge Function that recalculates price server-side

            const mockTrip = {
                id: 'trip-456',
                passenger_id: 'user-456',
                status: 'REQUESTED',
                priceUsd: 999, // Manipulated price!
                priceVes: 9990,
                distanceKm: 1, // Short distance but high price
                created_at: new Date().toISOString()
            };

            const mockFrom = supabase.from as any;
            mockFrom.mockReturnValue({
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                    data: mockTrip,
                    error: null
                })
            });

            // Malicious user could send manipulated price
            await TripService.createTrip(
                'user-456',
                { address: 'A', lat: 10, lng: -66 },
                { address: 'B', lat: 10.01, lng: -66.01 },
                'standard',
                'sedan',
                { usd: 999, ves: 9990 }, // ⚠️ Client controls this!
                1, // Only 1km
                false
            );

            const insertCall = mockFrom.mock.results[0].value.insert;
            expect(insertCall).toHaveBeenCalledWith([
                expect.objectContaining({
                    priceUsd: 999,
                    priceVes: 9990,
                    distanceKm: 1
                })
            ]);

            // This test PASSES but documents the risk
            // TODO: Move pricing calculation to server-side Edge Function
        });
    });

    describe('createTrip', () => {
        it('should insert trip with correct payload', async () => {
            const mockTrip = {
                id: 'trip-789',
                passenger_id: 'user-789',
                status: 'REQUESTED',
                origin: 'Origin Address',
                destination: 'Destination Address',
                origin_lat: 10.5,
                origin_lng: -66.9,
                destination_lat: 10.6,
                destination_lng: -66.8,
                priceUsd: 15,
                priceVes: 150,
                distanceKm: 10,
                serviceId: 'express',
                vehicleType: 'suv',
                created_at: new Date().toISOString()
            };

            const mockFrom = supabase.from as any;
            mockFrom.mockReturnValue({
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                    data: mockTrip,
                    error: null
                })
            });

            const result = await TripService.createTrip(
                'user-789',
                { address: 'Origin Address', lat: 10.5, lng: -66.9 },
                { address: 'Destination Address', lat: 10.6, lng: -66.8 },
                'express',
                'suv',
                { usd: 15, ves: 150 },
                10,
                false
            );

            expect(result).toMatchObject({
                id: 'trip-789',
                passengerId: 'user-789',
                status: 'REQUESTED',
                priceUsd: 15,
                priceVes: 150
            });
        });

        it('should include coordinates for PostGIS matching when available', async () => {
            const mockFrom = supabase.from as any;
            mockFrom.mockReturnValue({
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                    data: { id: 'trip-999', created_at: new Date().toISOString() },
                    error: null
                })
            });

            await TripService.createTrip(
                'user-999',
                { address: 'A', lat: 10.5, lng: -66.9 },
                { address: 'B', lat: 10.6, lng: -66.8 },
                'standard',
                'sedan',
                { usd: 5, ves: 50 },
                3,
                false
            );

            const insertCall = mockFrom.mock.results[0].value.insert;
            expect(insertCall).toHaveBeenCalledWith([
                expect.objectContaining({
                    origin_lat: 10.5,
                    origin_lng: -66.9,
                    destination_lat: 10.6,
                    destination_lng: -66.8
                })
            ]);
        });
    });

    describe('triggerMatching', () => {
        it('should invoke match-driver Edge Function (fire-and-forget)', async () => {
            const mockSession = {
                access_token: 'mock-token-123'
            };

            (supabase.auth.getSession as any).mockResolvedValue({
                data: { session: mockSession }
            });

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ success: true })
            });

            await TripService.triggerMatching('trip-123');

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/functions/v1/match-driver'),
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer mock-token-123'
                    }),
                    body: JSON.stringify({ trip_id: 'trip-123' })
                })
            );
        });

        it('should handle missing session gracefully', async () => {
            (supabase.auth.getSession as any).mockResolvedValue({
                data: { session: null }
            });

            // Should not throw
            await TripService.triggerMatching('trip-456');

            expect(global.fetch).not.toHaveBeenCalled();
        });
    });

    describe('cancelTrip', () => {
        it('should update trip status to CANCELLED', async () => {
            const mockFrom = supabase.from as any;
            mockFrom.mockReturnValue({
                update: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ error: null })
            });

            await TripService.cancelTrip('trip-cancel-123');

            expect(supabase.from).toHaveBeenCalledWith('trips');
            const updateCall = mockFrom.mock.results[0].value.update;
            expect(updateCall).toHaveBeenCalledWith({ status: 'CANCELLED' });
        });
    });

    describe('getTripHistory', () => {
        it('should filter trips by userId (passenger or driver)', async () => {
            const mockTrips = [
                {
                    id: 'trip-1',
                    passenger_id: 'user-123',
                    driver_id: null,
                    status: 'COMPLETED',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'trip-2',
                    passenger_id: 'other-user',
                    driver_id: 'user-123',
                    status: 'COMPLETED',
                    created_at: new Date(Date.now() - 86400000).toISOString()
                }
            ];

            const mockFrom = supabase.from as any;
            mockFrom.mockReturnValue({
                select: vi.fn().mockReturnThis(),
                or: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({
                    data: mockTrips,
                    error: null
                })
            });

            const result = await TripService.getTripHistory('user-123');

            expect(supabase.from).toHaveBeenCalledWith('trips');
            const orCall = mockFrom.mock.results[0].value.or;
            expect(orCall).toHaveBeenCalledWith('passenger_id.eq.user-123,driver_id.eq.user-123');
            expect(result).toHaveLength(2);
        });
    });

    describe('getActiveTrip', () => {
        it('should return only active trips with correct statuses', async () => {
            const mockActiveTrip = {
                id: 'trip-active-1',
                passenger_id: 'user-123',
                status: 'IN_PROGRESS',
                created_at: new Date().toISOString()
            };

            const mockFrom = supabase.from as any;
            mockFrom.mockReturnValue({
                select: vi.fn().mockReturnThis(),
                or: vi.fn().mockReturnThis(),
                in: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({
                    data: mockActiveTrip,
                    error: null
                })
            });

            const result = await TripService.getActiveTrip('user-123');

            const inCall = mockFrom.mock.results[0].value.in;
            expect(inCall).toHaveBeenCalledWith('status', ['REQUESTED', 'MATCHING', 'ACCEPTED', 'IN_PROGRESS']);
            expect(result).toMatchObject({
                id: 'trip-active-1',
                status: 'IN_PROGRESS'
            });
        });

        it('should return null when no active trips exist', async () => {
            const mockFrom = supabase.from as any;
            mockFrom.mockReturnValue({
                select: vi.fn().mockReturnThis(),
                or: vi.fn().mockReturnThis(),
                in: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({
                    data: null,
                    error: null
                })
            });

            const result = await TripService.getActiveTrip('user-no-trips');

            expect(result).toBeNull();
        });
    });
});
