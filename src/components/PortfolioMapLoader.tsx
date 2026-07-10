"use client";

import dynamic from "next/dynamic";

const PortfolioMap = dynamic(() => import("./PortfolioMap"), { ssr: false });

export default PortfolioMap;
