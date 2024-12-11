import { BingoBoard } from "./_components/BingoBoard";

export default async function Home({ params }: { params: Promise<{ gameId: string }> }) {
    const gameId = (await params).gameId
    return <BingoBoard gameId={gameId} />
}
