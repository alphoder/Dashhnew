'use client';

import { ICreator } from '@/lib/interface/creator';
import { IUser } from '@/lib/interface/user';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { Connection, PublicKey, Transaction, SystemProgram, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';

export const dynamic = 'force-dynamic';

const Getsoladd = ({ leaderboard, id, creator }: { leaderboard: IUser[], id: string, creator: ICreator }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const isPhantomInstalled = () => {
    return typeof window !== 'undefined' && window.solana && (window.solana.isPhantom || window.solana.isMobile);
  };

  useEffect(() => {
    getSolanaAddress();
  }, []);

  async function getSolanaAddress() {
    if (isPhantomInstalled()) {
      try {
        const { solana }: any = window;
        // Request connection to Phantom
        const response = await solana.connect();
        console.log('Connected to wallet:', response.publicKey.toString());
        setWalletAddress(response.publicKey.toString());
      } catch (error) {
        console.error('Error connecting to Phantom wallet:', error);
      }
    }
  }

  async function sendTransaction() {
    if (!walletAddress) {
      console.log('Wallet not connected');
      return;
    }

    const rpc = process.env.NEXT_PUBLIC_SOLANA_RPC || clusterApiUrl('devnet');
    const connection = new Connection(rpc, 'confirmed');
    if (!leaderboard.length) {
      console.error('Leaderboard is empty');
      return;
    }
    const recipientAddress = new PublicKey(leaderboard[0].solAdd);
    const senderPublicKey = new PublicKey(walletAddress); // Sender's public key (your wallet)

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderPublicKey,
        toPubkey: recipientAddress,
        lamports: creator.amount * LAMPORTS_PER_SOL // Amount to send (in lamports, 1 SOL = 1e9 lamports)
      })
    );

    try {
      // Fetch with 'finalized' for max validity window, and pass full
      // blockhash-with-expiry to confirmTransaction so RPC knows when to stop
      // waiting. Retry preflight up to 3× for flaky public-devnet 429s.
      const latest = await connection.getLatestBlockhash('finalized');
      transaction.recentBlockhash = latest.blockhash;
      transaction.feePayer = senderPublicKey;

      const { solana }: any = window;
      const signedTransaction = await solana.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        { skipPreflight: false, maxRetries: 3 },
      );
      await connection.confirmTransaction(
        {
          signature,
          blockhash: latest.blockhash,
          lastValidBlockHeight: latest.lastValidBlockHeight,
        },
        'confirmed',
      );

      console.log('Transaction successful, signature:', signature);
    } catch (error) {
      console.error('Error sending transaction:', error);
    }
  }

  return (
    <div className='text-white flex justify-end m-5 gap-3'>
      {leaderboard.some(item => item.solAdd === walletAddress) && (
        <Link href={`https://reclaim-verify-xmm5.vercel.app/?id=${id}`}>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white text-xl font-medium rounded hover:bg-blue-700">
            Verify with Reclaim
          </button>
        </Link>
      )}

      {creator.solAdd === walletAddress && (
        <>
          <button onClick={sendTransaction} className="mt-4 px-4 py-2 bg-green-600 text-white text-xl font-medium rounded hover:bg-green-700">
            Disperse
          </button>
        </>
      )}
    </div>
  );
};

export default Getsoladd;