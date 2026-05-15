"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { PrimaryCTA } from "@/components/primary-cta";
import blockchainlogo from "@/images/blockchain.png";
import solanalogo from "@/images/solana.png";
import gamelogo from "@/images/game.png";
import weblogo from "@/images/web.png";
import reclaimlogo from "@/images/reclaim.png";
import logo from "../images/whiteDASHH.png";
const demoImages = [
  {
    src: blockchainlogo,
    alt: "Blockchain",
  },
  {
    src: solanalogo,
    alt: "Solana",
  },
  {
    src: gamelogo,
    alt: "Game",
  },
  {
    src: weblogo,
    alt: "Web",
  },
  {
    src: reclaimlogo,
    alt: "Reclaim",
  },
];

export function HeroSection() {
  return (
    <section className="h-screen min-h-fit my-2 mb-36 md:mb-0">
      <div className="container relative h-full items-center flex  justify-center mx-auto px-4 py-24 lg:px-8">
        <div className="grid gap-12  lg:grid-cols-2 lg:gap-8">
          <div className="flex   h-full mt-36 z-10 md:mt-0 text-center md:text-left flex-col justify-center space-y-10 items-center md:items-start md:space-y-12">
            <div className="inline-flex items-center gap-2 self-center md:self-start rounded-full border border-[#14F195]/30 bg-[#14F195]/10 px-3 py-1 text-[11px] font-medium text-[#14F195]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#14F195] opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#14F195]" />
              </span>
              Live on Solana Devnet · zkTLS-verified
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
              <span className="text-white">Brands paid </span>
              <span className="bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">
                $1.4B
              </span>
              <span className="text-white"> for </span>
              <span className="bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">
                fake&nbsp;views
              </span>
              <span className="text-white"> in 2025.</span>
              <br />
              <span className="text-white">We make that mathematically impossible.</span>
            </h1>
            <div className="space-y-4">
              <p className="text-base md:text-lg text-center md:text-left text-zinc-300 leading-relaxed max-w-xl">
                DASHH escrows your ad budget on Solana, verifies every view with
                <span className="text-white font-medium"> zkTLS proofs</span> via Reclaim Protocol,
                and pays creators only for real engagement.
                No middlemen, no admins, no manipulation.
              </p>
            </div>
            {/* <div className="absolute w-screen overflow-hidden inset-0 z-0">
              {[...Array(5)].map((_, index) => (
                <motion.div
                  key={index}
                  className={`-z-10 absolute h-[300px] w-[300px] rounded-full ${
                    index % 2 === 0
                      ? "bg-[#9945FF]"
                      : index == 3
                      ? "bg-[#ff4a7d]"
                      : "bg-[#14F195]"
                  } from-[#9945FF] via-[#9945FF] to-[#14F195] blur-[80px] opacity-30`}
                  initial={{
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight,
                  }}
                  animate={{
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight,
                  }}
                  transition={{
                    duration: 10 + index * 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div> */}
            <div className="flex flex-wrap items-center gap-3">
              <PrimaryCTA variant="hero" />
              <Link
                href="/discover?demo=1"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/90 transition hover:bg-white/10"
              >
                Try the live demo · no wallet needed
              </Link>
            </div>
          </div>

          <div className="relative  min-h-[33rem]">
            {/* purple gradient  */}
            {/* <motion.div
              className="absolute right-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-gradient-to-br from-purple-600/20 to-purple-900/30 blur-2xl"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.6, 0.5],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            /> */}
            <div className="my-56 w-fit aspect-square sm:hidden md:block">
              {/* Orbital elements */}
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute left-1/2 top-1/2"
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                    delay: i * -4,
                  }}
                >
                  <div
                    className="relative h-4 w-4 -translate-x-1/2 -translate-y-1/2"
                    style={{
                      transform: `rotate(${72}deg) translateX(${150 + i}px)`,
                    }}
                  >
                    <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-transparent bg-white/10 backdrop-blur-sm">
                      <Image
                        src={demoImages[i].src}
                        alt="Team member"
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
              {/* Center elements */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <motion.div
                  className="h-16 w-16 text-white"
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <div className="relative h-16 w-16 rounded-full bg-gradient-to-r from-[#9945FF] via-[#9945FF] to-[#14F195] p-[2px]">
                    <Image
                      src={logo}
                      alt="Team member"
                      width={40}
                      height={40}
                      className="h-ful  p-1 w-full object-cover rounded-full bg-[#121212]"
                    />
                  </div>

                  {/* Placeholder for logo/star */}
                  {/* <div className="h-full w-full rounded-full bg-gradient-to-br from-white/20 to-purple-500/20 backdrop-blur-sm" /> */}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
