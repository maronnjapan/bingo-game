import { BingoDashboard } from "./_components/BingoDashboard";




export default async function Page({ params }: { params: Promise<{ gameId: string }> }) {
    const gameId = (await params).gameId
    return <BingoDashboard gameId={gameId}></BingoDashboard>
}