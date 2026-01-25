import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TripService } from '../tripService';
import { supabase } from '../supabaseClient';

// Mock Supabase
vi.mock('../supabaseClient', () => ({
    supabase: {
        from: vi.fn(() => ({
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn(),
            maybeSingle: vi.fn(),
        })),
        auth: {
            getSession: vi.fn(),
        },
        channel: vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn(),
        })),
    },
}));

// Mock global fetch for Edge Functions
global.fetch = vi.fn();

describe('TripService Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createTrip', () => {
        it('should create a trip and trigger matching engine', async () => {
            const mockTrip = { id: 'trip-123', status: 'REQUESTED' };
            const passengerId = 'p-123';
            const origin = { address: 'Calle 1', lat: 10, lng: -66 };
            const destination = { address: 'Calle 2', lat: 10.1, lng: -66.1 };
            const price = { usd: 5, ves: 180 };

            (supabase.from as any)().single.mockResolvedValueOnce({
                data: { ...mockTrip, passenger_id: passengerId, origin: origin.address, destination: destination.address },
                error: null,
            });

            // Mock session for triggerMatching
            (supabase.auth.getSession as any).mockResolvedValueOnce({
                data: { session: { access_token: 'fake-token' } },
            });

            (global.fetch as any).mockResolvedValueOnce({ ok: true });

            const result = await TripService.createTrip(
                passengerId,
                origin,
                destination,
                'standard',
                'car',
                price,
                5,
                true
            );

            expect(result.id).toBe('trip-123');
            expect(supabase.from).toHaveBeenCalledWith('trips');
            // Verify async matching trigger (indirectly via fetch)
            expect(global.fetch).toHaveBeenCalled();
        });
    });

    describe('triggerMatching', () => {
        it('should invoke match-driver Edge Function (fire-and-forget)', async () => {
            (supabase.auth.getSession as any).mockResolvedValueOnce({
                data: { session: { access_token: 'token' } },
            });
            (global.fetch as any).mockResolvedValueOnce({ ok: true });

            await TripService.triggerMatching('trip-123');

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/functions/v1/match-driver'),
                expect.objectContaining({ method: 'POST' })
            );
        });

        it('should handle missing session gracefully', async () => {
            (supabase.auth.getSession as any).mockResolvedValueOnce({
                data: { session: null },
            });
            const spy = vi.spyOn(console, 'warn');

            await TripService.triggerMatching('trip-123');

            expect(spy).toHaveBeenCalledWith('No session, skipping match trigger');
        });
    });

    describe('subscribeToTrip', () => {
        it('should setup a realtime channel', () => {
            const callback = vi.fn();
            TripService.subscribeToTrip('trip-123', callback);

            expect(supabase.channel).toHaveBeenCalledWith('trip:trip-123');
        });
    });

    describe('Security Audit (Static)', () => {
        it('should not allow overriding sensitive fields in manual inserts if refactored', async () => {
            // This verifies the current implementation's use of a controlled insertPayload
            const fs = await import('fs');
            const serviceContent = fs.readFileSync('src/services/tripService.ts', 'utf8');
            // Ensure we don't spread untrusted inputs directly into the payload
            expect(serviceContent).not.toContain('...origin');
            expect(serviceContent).not.toContain('...destination');
        });
    });
});
