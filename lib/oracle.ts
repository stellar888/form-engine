import oracleData from "@/oracle_cards.json";

export type OracleCard = {
  id: number;
  title: string;
  image: string;
  description: string;
  readingNotes: string;
  questions: string[];
  relatedEnergies: {
    chakra: string;
    planet: string;
    sign: string;
  };
  quote: string;
};

type OraclePayload = {
  system: string;
  cards: OracleCard[];
};

const payload = oracleData as OraclePayload;

export const ORACLE_SYSTEM = payload.system;
export const ORACLE_CARDS = [...payload.cards].sort((a, b) => a.id - b.id);

export function getCardById(id: number): OracleCard | undefined {
  return ORACLE_CARDS.find((card) => card.id === id);
}
