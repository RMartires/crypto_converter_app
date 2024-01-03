"use client";
import React, { useEffect, useState } from "react";
import { cryptoCurrencyMapResponse } from "./types/crypto";

export default function CryptoBar() {
  const [CryptoCurrecies, SetCryptoCurrecies] = useState(
    [] as cryptoCurrencyMapResponse[]
  );
  const [SelectedCrypto, SetSelectedCrypto] = useState({
    slug: "bitcoin",
    symbol: "BTC",
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
  });

  const [Currencies, SetCurrencies] = useState({} as Record<string, string>);
  const [SelectedFiat, SetSelectedFiat] = useState("USD");

  const [Ammount, SetAmmount] = useState(100);
  const [ConvertedValue, SetConvertedValue] = useState(null);

  const [ErrMsg, SetErrMsg] = useState<string | null>(null);

  async function CallListAPI() {
    const options = {
      method: "GET",
      headers: { "User-Agent": "insomnium/0.2.3-a" },
    };

    fetch("https://www.rohitmartires.xyz/crypto/list", options)
      .then((response) => response.json())
      .then((response) => {
        const { cryptoCurrenciesList, currenciesList } = response as {
          cryptoCurrenciesList: cryptoCurrencyMapResponse[];
          currenciesList: Record<string, string>;
        };

        SetCryptoCurrecies(cryptoCurrenciesList);
        SetCurrencies(currenciesList);
      })
      .catch((err) => console.error("Failed to list currencies", err));
  }

  useEffect(() => {
    CallListAPI();
    CallConverAPI();
  }, []);

  async function CallConverAPI() {
    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        src: SelectedCrypto.slug,
        target: SelectedFiat,
        ammount: Ammount,
      }),
    };

    SetErrMsg(null);

    fetch("https://www.rohitmartires.xyz/crypto/convert", options)
      .then((response) => {
        if (response.status === 200) {
          return response.json();
        } else {
          throw new Error("Failed to convert value");
        }
      })
      .then((response) => {
        SetConvertedValue(response.value);
      })
      .catch((err) => {
        console.log("Failed to convert crypto value", err);
        SetErrMsg(err.message);
      });
  }

  return (
    <div className="w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
      <div className="flex flex-col items-center pb-10">
        <img
          className="w-24 h-24 mb-3 rounded-full shadow-lg"
          src={SelectedCrypto.logo}
          alt="Bonnie image"
        />
        <button
          id="dropdownDefaultButton"
          data-dropdown-toggle="dropdown"
          className="text-white bg-blue-700 bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:bg-blue-700 dark:focus:ring-blue-800"
          style={{ backgroundColor: "blue" }}
          type="button"
        >
          <h5 className="mb-1 text-xl font-medium text-gray-900 text-white">
            {SelectedCrypto.symbol}
          </h5>
          <svg
            className="w-2.5 h-2.5 ms-3"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 10 6"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m1 1 4 4 4-4"
            />
          </svg>
        </button>

        {/* dropdown */}
        <div
          id="dropdown"
          className="z-10 hidden bg-white rounded-lg shadow w-60 dark:bg-gray-700"
        >
          <ul
            className="h-48 py-2 overflow-y-auto text-gray-700 dark:text-gray-200"
            aria-labelledby="dropdownDefaultButton"
          >
            {CryptoCurrecies.map((cryptoCurrency) => (
              <li key={cryptoCurrency.id}>
                <a
                  onClick={() => {
                    SetSelectedCrypto(cryptoCurrency);
                  }}
                  className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                >
                  <img
                    className="w-6 h-6 me-2 rounded-full"
                    src={cryptoCurrency.logo}
                    alt="Jese image"
                  />
                  {cryptoCurrency.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <span className="text-sm text-gray-500 dark:text-gray-400">
          {SelectedCrypto.slug}
        </span>

        <div className="flex mt-6 md:mt-6">
          <div className="max-w-[18rem] mx-auto flex">
            <div className="relative w-full">
              <div className="absolute inset-y-0 start-0 top-0 flex items-center ps-3.5 pointer-events-none"></div>
              <input
                type="number"
                id="currency-input"
                className="block p-2.5 w-full z-20 ps-10 text-sm text-gray-900 bg-gray-50 rounded-s-lg border-e-gray-50 border-e-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-e-gray-700  dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-blue-500"
                placeholder="Enter amount"
                required
                value={Ammount}
                onChange={(e) => {
                  const ammount = Number(e.target.value);

                  if (ammount >= 0) {
                    SetAmmount(ammount);
                  }
                }}
              />
            </div>
            <button
              id="dropdown-currency-button"
              data-dropdown-toggle="dropdown-currency"
              className="flex-shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm font-medium text-center text-gray-900 bg-gray-100 border border-gray-300 rounded-e-lg hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700 dark:text-white dark:border-gray-600"
              type="button"
            >
              {SelectedFiat}
              <svg
                className="w-2.5 h-2.5 ms-2.5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 10 6"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m1 1 4 4 4-4"
                />
              </svg>
            </button>
            <div
              id="dropdown-currency"
              className="z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-36 dark:bg-gray-700"
            >
              <ul
                className="h-48 py-2 overflow-y-auto text-gray-700 dark:text-gray-200"
                aria-labelledby="dropdown-currency-button"
              >
                {Object.keys(Currencies).map((currencyKey) => (
                  <li key={currencyKey}>
                    <a
                      onClick={() => {
                        SetSelectedFiat(currencyKey);
                      }}
                      className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                    >
                      {/* <img
                        className="w-6 h-6 me-2 rounded-full"
                        src="https://s2.coinmarketcap.com/static/img/coins/64x64/2.png"
                        alt="Jese image"
                      /> */}
                      {currencyKey}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex mt-4 md:mt-6">
          <a
            onClick={() => {
              SetConvertedValue(null);
              CallConverAPI();
            }}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            Convert
          </a>
          <h3
            style={{ color: "black" }}
            className="px-4 py-2 text-sm font-medium text-center text-white"
          >
            {ConvertedValue === null && ErrMsg === null ? (
              <div role="status">
                <svg
                  aria-hidden="true"
                  className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
                <span className="sr-only">Loading...</span>
              </div>
            ) : (
              ConvertedValue ?? <p style={{ color: "red" }}>{ErrMsg}</p>
            )}
          </h3>
        </div>
      </div>
    </div>
  );
}
