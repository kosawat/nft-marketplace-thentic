/* eslint-disable @next/next/no-img-element */

import type { NextPage } from "next";
import { useEffect, useState } from "react";
import axios from "axios";

import { chainId, thenticKey } from "../utils/config";

const Home: NextPage = () => {
  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNfts();
  }, []);

  const loadNfts = async () => {
    try {
      const res = await axios({
        method: "get",
        url: "https://thentic.tech/api/nfts",
        params: {
          key: thenticKey,
          chain_id: chainId,
        },
        headers: {
          "Content-Type": "application/json",
        },
      });

      const nftItems = await Promise.all(
        res.data.nfts.map(async (nft: { data: any; id: any; status: any }) => {
          const tokenUri = nft.data;
          const meta = await axios.get(tokenUri);

          let nftItem = {
            tokenId: nft.id,
            name: meta.data.name,
            image: meta.data.image,
            description: meta.data.description,
            price: meta.data.price,
            status: nft.status,
          };

          return nftItem;
        })
      );
      setNfts(nftItems);
      setLoading(true);
    } catch (error) {
      console.log("Error load NFTs :", error);
    }
  };

  if (!loading)
    return <h1 className="px-20 py-10 text-3xl">Loading NFTs.......</h1>;

  if (loading && !nfts.length)
    return (
      <h1 className="px-20 py-10 text-3xl">
        There is no NFTs in marketplace
      </h1>
    );

  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: "1600px" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 pt-4">
          {nfts.map((nft, i) => (
            <div
              key={i}
              className="border shadow rounded-xl overflow-hidden mx-5 my-5 flex flex-col"
            >
              <img
                src={nft.image}
                alt={nft.name}
                width={300}
                className="m-auto"
              />
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-2xl font-semibold h-64"
                >
                  {nft.name}
                </p>
                <div style={{ height: "70px", overflow: "hidden" }}>
                  <p className="text-gray-400">{nft.description}</p>
                </div>
                <div style={{ height: "50px"}}>
                  <p className="text-black mt-8">Mint Status: {nft.status}</p>
                </div>
              </div>
              <div className="p-4 bg-black mt-auto">
                <p className="text-2xl mb-4 font-bold text-white">
                  {nft.price} BNB
                </p>
                <button
                  className="w-full bg-red-500 text-white font-bold py-2 px-12 rounded"
                  onClick={() => alert("Buying NFTs is coming soon!")}
                >
                  Buy now <br />
                  (Coming Soon!)
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
