export function UserGreeting() {
    // Todo: Connect to Auth Context for real name
    const userName = "Pana";

    return (
        <header className="px-4 pt-4 pb-2">
            <h1 className="text-2xl font-bold text-gray-900">
                Hola {userName},
                <br />
                <span className="text-gray-500 text-lg font-normal">¿Qué vamos a hacer?</span>
            </h1>
        </header>
    );
}
