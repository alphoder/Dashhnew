import { db } from "@/lib/db";
import { creators } from "@/lib/db/schema";
import { ICreator } from "@/lib/interface/creator";
import { desc } from "drizzle-orm";

import Creatorpage from "./creatorpage";
export const dynamic = 'force-dynamic';

export default async function Component() {
  let creatorList: ICreator[] = [];

  try {
    creatorList = await db.select().from(creators).orderBy(desc(creators.createdAt)) as ICreator[];
  } catch (error) {
    console.error(error);
  }

  return <Creatorpage creator={creatorList} />;
}
