import { BingoBoard } from "./_components/BingoBoard";

export default function Home({ params }: { params: { gameId: string } }) {
    return <BingoBoard gameId={params.gameId} />
}
