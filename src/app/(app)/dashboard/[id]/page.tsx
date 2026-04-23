import React from 'react'
import Image from 'next/image'
import { Clock, Trophy } from 'lucide-react'
import { db } from '@/lib/db'
import { creators, users } from '@/lib/db/schema'
import { IUser } from '@/lib/interface/user'
import Getsoladd from './getsoladd'
import { ICreator } from '@/lib/interface/creator'
import { eq, desc, like } from 'drizzle-orm'
import { BackBar } from '@/components/back-bar'

export default async function Page({ params }: { params: { id: string } }) {
  let leaderboard: IUser[] = []
  let creator: ICreator = {} as ICreator

  try {
    leaderboard = await db.select().from(users)
      .where(like(users.post, `%/api/donate/${params.id}%`))
      .orderBy(desc(users.views)) as IUser[]

    const [result] = await db.select().from(creators).where(eq(creators.id, params.id))
    if (result) {
      creator = result as ICreator
    }
  } catch (error) {
    console.error(error)
  }

  return (
    <div className="min-h-screen text-white p-4 sm:p-8 font-mono pt-24">
      <div className="max-w-4xl mx-auto space-y-8">
        <BackBar
          crumbs={[
            { label: 'Brand dashboard', href: '/dashboard' },
            { label: 'Campaign' },
          ]}
          backHref="/dashboard"
        />
        <Getsoladd leaderboard={leaderboard} id={params.id} creator={creator} />

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#9945FF] via-[#9945FF] to-[#14F195] text-transparent bg-clip-text">
            LEADERBOARD
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm">
            Top performers in the challenge
          </p>
        </div>

        {/* Podium */}
        <div className="relative h-[200px] sm:h-[250px]">
          {leaderboard.slice(0, 3).map((player, index) => (
            <div key={player.id} className={`absolute ${index === 1 ? 'left-1/2 bottom-8 transform -translate-x-1/2' : index === 0 ? 'left-0 sm:left-1/4 bottom-0 transform sm:-translate-x-1/2' : 'right-0 sm:left-3/4 bottom-0 transform sm:-translate-x-1/2'} flex flex-col items-center`}>
              <div className="relative mb-2">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 ${index === 1 ? 'sm:w-24 sm:h-24' : ''} rounded-lg overflow-hidden`}>
                  <Image
                  src={player.igProfile || (index === 0) ? "https://assets.promptbase.com/DALLE_IMAGES%2F3X1SXaf7riVzZ4fmeD70dlwbQvD3%2Fresized%2F1679336685019_800x800.webp?alt=media&token=d2d7f2fa-d397-43c8-8f52-8282e5728752" : index === 1 ? "https://img.freepik.com/free-vector/hand-drawn-nft-style-ape-illustration_23-2149622021.jpg" : "https://i.pinimg.com/474x/aa/f8/59/aaf859dde8eb62bd0c382bb047a53ce7.jpg"}
                    alt={player.solAdd}
                    width={96}
                    height={96}
                    className="object-cover mix-blend-overlay"
                  />
                </div>
              </div>
              <div className="bg-black/50 p-2 rounded text-xs sm:text-sm space-y-1">
                <p className="bg-gradient-to-r from-[#9945FF] via-[#9945FF] to-[#14F195] text-transparent bg-clip-text font-bold">
                  [{index + 1}] RockStar
                </p>
                <p className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-[#9945FF] to-[#14F195] rounded-full" />
                  {player.views} SOL
                </p>
              </div>
              <div className={`w-24 sm:w-32 h-24 sm:h-32 ${index === 1 ? 'h-32 sm:h-40' : index === 2 ? 'h-20 sm:h-24' : ''} bg-gradient-to-r from-[#9945FF]/20 to-[#14F195]/20 transform skew-y-[45deg] -z-10 absolute -bottom-12 sm:-bottom-16`} />
            </div>
          ))}
        </div>

        {/* Countdown Timer */}
        <div className="text-center pt-10 sm:pt-16 mb-6">
          <div className="flex items-center justify-center text-gray-400">
            <Clock className="w-4 h-4 mr-2" />
            <span>Ends in</span>
          </div>
          <div className="text-xl font-bold bg-gradient-to-r from-[#9945FF] via-[#9945FF] to-[#14F195] text-transparent bg-clip-text">00d 00h 43m 51s</div>
        </div>

        {/* Status Bar */}
        <div className="bg-gray-900/50 rounded-full py-2 px-4 text-center text-sm text-gray-400">
          <span>You earned <span className="text-[#9945FF]">50</span> today and are ranked - out of <span className="text-white">13868</span> users</span>
        </div>

        {/* Leaderboard Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="text-left p-2 sm:p-4">PLACE</th>
                <th className="text-left p-2 sm:p-4">USERNAME</th>
                <th className="text-right p-2 sm:p-4">VIEWS</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.slice(3).map((player, index) => (
                <tr key={player.id} className="border-b border-gray-800">
                  <td className="p-2 sm:p-4 flex items-center">
                    <Trophy className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="bg-gradient-to-r from-[#9945FF] via-[#9945FF] to-[#14F195] text-transparent bg-clip-text">
                      {index + 4}
                    </span>
                  </td>
                  <td className="p-2 sm:p-4">{player.solAdd}</td>
                  <td className="p-2 sm:p-4 text-right flex items-center justify-end">
                    {player.views}
                    <span className="inline-block w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-[#9945FF] to-[#14F195] rounded-full ml-2" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
