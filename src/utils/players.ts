import { PlayerInfo } from "@/app/api/bingo/players/route";

export let players: { [gameId: string]: PlayerInfo[] } = {};
