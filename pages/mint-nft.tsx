/* eslint-disable @next/next/no-img-element */

import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axios from "axios";

import {
  chainId,
  nftContractAddress,
  pinataKey,
  pinataSecret,
  thenticKey,
} from "../utils/config";

const MintNFT: NextPage = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [formInput, updateFormInput] = useState({
    price: "",
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    getEthereum();
    getWalletAddress();
  }, []);

  // get Metamask object from browser
  const getEthereum = () => {
    // @ts-ignore
    const { ethereum } = window;
    return ethereum;
  };

  // get wallet address from Metamask
  const getWalletAddress = () => {
    const ethereum = getEthereum();
    setWalletAddress(ethereum.selectedAddress);
  };

  // Connect Metamask wallet
  const connectMetamask = async () => {
    try {
      const ethereum = getEthereum();
      await ethereum.request({ method: "eth_requestAccounts" });
      setWalletAddress(ethereum.selectedAddress);
    } catch (error) {
      console.error("Error connecting Metamask :", error);
    }
  };

  // Upload image to Pinata IPFS
  const onChange = async (e: any) => {
    const file = e.target.files[0];

    try {
      const formData = new FormData();
      formData.append("file", file);
      const resFile = await axios({
        method: "post",
        url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
        data: formData,
        headers: {
          pinata_api_key: pinataKey,
          pinata_secret_api_key: pinataSecret,
          "Content-Type": "multipart/form-data",
        },
      });

      const ImageURL = `https://gateway.pinata.cloud/ipfs/${resFile.data.IpfsHash}`;
      setFileUrl(ImageURL);
    } catch (error) {
      console.log("Error uploading image to Pinata :", error);
    }
  };

  // First upload metadata to Pinata IPFS and then return URI of metadata
  const uploadToIPFS = async () => {
    const { name, description, price } = formInput;
    if (!name || !description || !price || !fileUrl) return;
    setLoading(true);

    try {
      const jsondata = JSON.stringify({
        pinataMetadata: {
          name: `${name}.json`,
        },
        pinataContent: {
          name,
          description,
          image: fileUrl,
          price,
        },
      });

      const resFile = await axios({
        method: "post",
        url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        data: jsondata,
        headers: {
          pinata_api_key: pinataKey,
          pinata_secret_api_key: pinataSecret,
          "Content-Type": "application/json",
        },
      });

      const tokenURI = `https://gateway.pinata.cloud/ipfs/${resFile.data.IpfsHash}`;
      return tokenURI;
    } catch (error) {
      console.log("Error uploading file :", error);
    }
  };

  // Get the ID for the newest NFT in the contract address
  const getLatestId = async () => {
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

      const nfts = res.data.nfts;

      // no NFT in this contract
      if (nfts.length === 0) {
        return 0;
      }

      // return the latest id
      const nftId = nfts[0].id;
      return parseInt(nftId);
    } catch (error) {
      console.log("Error getting latest NFT ID :", error);
    }
  };

  // Mint an NFT
  const mintNFT = async () => {
    try {
      const url = await uploadToIPFS();
      let nftId = await getLatestId();
      nftId && nftId++;

      const jsondata = JSON.stringify({
        key: thenticKey,
        chain_id: chainId,
        contract: nftContractAddress,
        nft_id: nftId,
        nft_data: url,
        to: walletAddress,
      });

      const res = await axios({
        method: "post",
        url: "https://thentic.tech/api/nfts/mint",
        data: jsondata,
        headers: {
          "Content-Type": "application/json",
        },
      });

      const transactionWindow = window.open(res.data.transaction_url);
      // close transaction window after 10 sec
      setTimeout(() => transactionWindow?.close(), 10000);
      router.push("/");
    } catch (error) {
      console.log("Error mint NFT :", error);
    }
  };

  return (
    <>
      <div className="flex justify-center">
        {walletAddress ? (
          <>
            <div className="w-1/8 flex flex-col mr-10 mt-10">
              {fileUrl && (
                <img
                  className="rounded mt-4"
                  alt=""
                  width="350px"
                  src={fileUrl}
                />
              )}
            </div>
            <div className="w-1/2 flex flex-col pb-12">
              <h1 className="pt-8 text-xl font-bold">Mint to your wallet address</h1>
              <p>{walletAddress}</p>
              <input
                placeholder="Asset Name"
                className="mt-8 border rounded p-4"
                onChange={(e) =>
                  updateFormInput({ ...formInput, name: e.target.value })
                }
              />
              <textarea
                placeholder="Asset Description"
                className="mt-2 border rounded p-4"
                onChange={(e) =>
                  updateFormInput({ ...formInput, description: e.target.value })
                }
              />
              <input
                placeholder="Asset Price"
                className="mt-2 border rounded p-4"
                onChange={(e) =>
                  updateFormInput({ ...formInput, price: e.target.value })
                }
              />
              <input
                type="file"
                name="Asset"
                className="mt-4"
                onChange={onChange}
              />{" "}
              {fileUrl && (
                <button
                  onClick={mintNFT}
                  className="font-bold mt-4 bg-red-500 text-white rounded p-4 shadow-lg"
                >
                  {!loading ? "Mint NFT" : "Wait uploading......"}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col mr-10 mt-10">
            <h1 className="m-5 text-xl">Please connect your metamask wallet</h1>
            <button
              onClick={connectMetamask}
              className="font-bold mt-4 bg-red-500 text-white rounded p-4 shadow-lg"
            >
              Connect Metamask Wallet
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default MintNFT;
