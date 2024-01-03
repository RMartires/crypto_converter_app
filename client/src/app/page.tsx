import React from "react";
import CryptoBar from "./cryptoBar";

function Home() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <CryptoBar />
    </div>
  );
}

export default Home;
