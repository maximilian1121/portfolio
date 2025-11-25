const gameList = [
    {
        title: "Ai Cookie Clicker",
        description:
            "A cookie clicker ripoff created by Claude sonnet 3.5 and fixed by ChatGPT 5",
        url: "/games/ai-cookie-clicker",
    },
];

export default function Games() {
    return (
        <div className="max-w-3xl py-12 space-y-8 mx-2 md:mx-auto">
            <h1 className="text-center text-4xl font-bold">Web games</h1>
            <div className="justify-center flex flex-wrap">
                {gameList.map((game, i) => (
                    <div
                        key={i}
                        className="relative w-[400px] bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition"
                    >
                        <h1 className="text-3xl font-semibold mb-4">
                            {game.title}
                        </h1>
                        <p className="text-lg font-semibold">
                            {game.description}
                        </p>
                        <a
                            href={game.url}
                            className="absolute inset-0 w-full h-full"
                        ></a>
                    </div>
                ))}
            </div>
        </div>
    );
}
