import { BingoDashboard } from "./_components/BingoDashboard";




export default function Page({ params }: { params: { gameId: string } }) {
    return <BingoDashboard gameId={params.gameId}></BingoDashboard>
}