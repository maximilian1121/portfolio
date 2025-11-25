"use client";

import React, { useState, useEffect } from "react";
import {
  FaCookieBite,
  FaBolt,
  FaIndustry,
  FaRocket,
  FaBrain,
  FaMagic,
  FaCrown,
  FaGem,
  FaStar,
  FaChartLine,
} from "react-icons/fa";

type FloatingNumber = {
  id: number;
  value: number;
  x: number;
  y: number;
};

type UpgradeType =
  | "clickPower"
  | "autoClicker"
  | "factory"
  | "megaFactory"
  | "lab"
  | "portal"
  | "timeMachine"
  | "clickMultiplier"
  | "productionMultiplier";

export default function ClickerGame() {
  const [cookies, setCookies] = useState(0);
  const [totalCookies, setTotalCookies] = useState(0);
  const [clickPower, setClickPower] = useState(1);
  const [autoClickers, setAutoClickers] = useState(0);
  const [factories, setFactories] = useState(0);
  const [megaFactories, setMegaFactories] = useState(0);
  const [labs, setLabs] = useState(0);
  const [portals, setPortals] = useState(0);
  const [timeMachines, setTimeMachines] = useState(0);
  const [clickMultiplier, setClickMultiplier] = useState(1);
  const [productionMultiplier, setProductionMultiplier] = useState(1);
  const [clickAnimation, setClickAnimation] = useState(false);
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
  const [lastSave, setLastSave] = useState(Date.now());

  // Load saved game on mount
  useEffect(() => {
    const saved = localStorage.getItem("cookieGameSave");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setCookies(data.cookies || 0);
        setTotalCookies(data.totalCookies || 0);
        setClickPower(data.clickPower || 1);
        setAutoClickers(data.autoClickers || 0);
        setFactories(data.factories || 0);
        setMegaFactories(data.megaFactories || 0);
        setLabs(data.labs || 0);
        setPortals(data.portals || 0);
        setTimeMachines(data.timeMachines || 0);
        setClickMultiplier(data.clickMultiplier || 1);
        setProductionMultiplier(data.productionMultiplier || 1);
        setLastSave(data.lastSave || Date.now());

        const timePassed = Math.floor(
          (Date.now() - (data.lastSave || Date.now())) / 1000
        );
        if (timePassed > 0 && timePassed < 86400) {
          const offlineCps =
            (data.autoClickers || 0) * 1 +
            (data.factories || 0) * 10 +
            (data.megaFactories || 0) * 100 +
            (data.labs || 0) * 500 +
            (data.portals || 0) * 2500 +
            (data.timeMachines || 0) * 10000;
          const offlineMultiplier = data.productionMultiplier || 1;
          const offlineEarnings = Math.floor(timePassed * offlineCps * offlineMultiplier);

          if (offlineEarnings > 0) {
            setCookies((prev) => prev + offlineEarnings);
            setTotalCookies((prev) => prev + offlineEarnings);
            setTimeout(() => {
              alert(`Welcome back! You earned ${offlineEarnings.toLocaleString()} cookies while you were away!`);
            }, 100);
          }
        }
      } catch (e) {
        console.error("Failed to load save:", e);
      }
    }
  }, []);

  // Auto-save every 5 seconds
  useEffect(() => {
    const saveInterval = setInterval(() => {
      const saveData = {
        cookies,
        totalCookies,
        clickPower,
        autoClickers,
        factories,
        megaFactories,
        labs,
        portals,
        timeMachines,
        clickMultiplier,
        productionMultiplier,
        lastSave: Date.now(),
      };
      localStorage.setItem("cookieGameSave", JSON.stringify(saveData));
      setLastSave(Date.now());
    }, 5000);
    return () => clearInterval(saveInterval);
  }, [
    cookies,
    totalCookies,
    clickPower,
    autoClickers,
    factories,
    megaFactories,
    labs,
    portals,
    timeMachines,
    clickMultiplier,
    productionMultiplier,
  ]);

  // Cookie production
  useEffect(() => {
    const interval = setInterval(() => {
      const baseCps =
        autoClickers * 1 +
        factories * 10 +
        megaFactories * 100 +
        labs * 500 +
        portals * 2500 +
        timeMachines * 10000;
      const cps = Math.floor(baseCps * productionMultiplier);
      if (cps > 0) {
        setCookies((prev) => prev + cps);
        setTotalCookies((prev) => prev + cps);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [autoClickers, factories, megaFactories, labs, portals, timeMachines, productionMultiplier]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const gainedCookies = Math.floor(clickPower * clickMultiplier);
    setCookies((prev) => prev + gainedCookies);
    setTotalCookies((prev) => prev + gainedCookies);
    setClickAnimation(true);
    setTimeout(() => setClickAnimation(false), 100);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now() + Math.random();

    setFloatingNumbers((prev) => [...prev, { id, value: gainedCookies, x, y }]);
    setTimeout(() => setFloatingNumbers((prev) => prev.filter((n) => n.id !== id)), 1000);
  };

  const buyUpgrade = (type: UpgradeType) => {
    const costs: Record<UpgradeType, number> = {
      clickPower: Math.floor(10 * 2 ** (clickPower - 1)),
      autoClicker: Math.floor(50 * 1.15 ** autoClickers),
      factory: Math.floor(500 * 1.15 ** factories),
      megaFactory: Math.floor(5000 * 1.15 ** megaFactories),
      lab: Math.floor(50000 * 1.15 ** labs),
      portal: Math.floor(500000 * 1.15 ** portals),
      timeMachine: Math.floor(10000000 * 1.15 ** timeMachines),
      clickMultiplier: Math.floor(1000 * 5 ** (clickMultiplier - 1)),
      productionMultiplier: Math.floor(10000 * 5 ** (productionMultiplier - 1)),
    };

    if (cookies >= costs[type]) {
      setCookies((prev) => prev - costs[type]);
      switch (type) {
        case "clickPower": setClickPower((prev) => prev + 1); break;
        case "autoClicker": setAutoClickers((prev) => prev + 1); break;
        case "factory": setFactories((prev) => prev + 1); break;
        case "megaFactory": setMegaFactories((prev) => prev + 1); break;
        case "lab": setLabs((prev) => prev + 1); break;
        case "portal": setPortals((prev) => prev + 1); break;
        case "timeMachine": setTimeMachines((prev) => prev + 1); break;
        case "clickMultiplier": setClickMultiplier((prev) => prev + 1); break;
        case "productionMultiplier": setProductionMultiplier((prev) => prev + 1); break;
      }
    }
  };

  const getCost = (type: UpgradeType, owned: number) => {
    const costs: Record<UpgradeType, number> = {
      clickPower: Math.floor(10 * 2 ** (clickPower - 1)),
      autoClicker: Math.floor(50 * 1.15 ** owned),
      factory: Math.floor(500 * 1.15 ** owned),
      megaFactory: Math.floor(5000 * 1.15 ** owned),
      lab: Math.floor(50000 * 1.15 ** owned),
      portal: Math.floor(500000 * 1.15 ** owned),
      timeMachine: Math.floor(10000000 * 1.15 ** owned),
      clickMultiplier: Math.floor(1000 * 5 ** (clickMultiplier - 1)),
      productionMultiplier: Math.floor(10000 * 5 ** (productionMultiplier - 1)),
    };
    return costs[type];
  };

  const resetGame = () => {
    if (window.confirm("Are you sure? This will delete all your progress!")) {
      localStorage.removeItem("cookieGameSave");
      window.location.reload();
    }
  };

  const baseCps =
    autoClickers * 1 +
    factories * 10 +
    megaFactories * 100 +
    labs * 500 +
    portals * 2500 +
    timeMachines * 10000;
  const cps = Math.floor(baseCps * productionMultiplier);

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-100 via-yellow-100 to-amber-100 p-4">

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-4xl font-bold text-amber-900">🍪 Cookie Clicker ripoff from Claude + ChatGPT 🍪</h1>
          <button
            onClick={resetGame}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors"
          >
            Reset Game
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-amber-600 mb-2">
                {Math.floor(cookies).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">cookies</div>
              {cps > 0 && (
                <div className="text-lg text-green-600 font-semibold mt-2">
                  +{cps.toLocaleString()} per second
                </div>
              )}
              <div className="text-xs text-gray-500 mt-1">
                Total baked: {Math.floor(totalCookies).toLocaleString()}
              </div>
            </div>

            <div className="relative mb-6">
              <button
                onClick={handleClick}
                className={`relative transition-transform ${
                  clickAnimation ? "scale-95" : "scale-100 hover:scale-105"
                } active:scale-95`}
              >
                <FaCookieBite size={200} className="text-amber-600 drop-shadow-2xl cursor-pointer" />
              </button>

              {floatingNumbers.map((num) => (
                <div
                  key={num.id}
                  className="absolute text-2xl font-bold text-amber-600 pointer-events-none animate-float"
                  style={{ left: num.x, top: num.y, animation: "floatUp 1s ease-out forwards" }}
                >
                  +{num.value}
                </div>
              ))}
            </div>

            <div className="text-center text-gray-600">
              <div className="text-lg font-semibold">
                Click Power: {clickPower} x{clickMultiplier}
              </div>
              <div className="text-sm text-gray-500">
                = {Math.floor(clickPower * clickMultiplier)} per click
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 max-h-[600px] overflow-y-auto">
            <h2 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-2 sticky top-0 bg-white pb-2">
              <FaChartLine size={24} /> Upgrades
            </h2>

            <div className="space-y-3">
              {[
                { type: "clickPower", icon: FaBolt, name: "Stronger Clicks", desc: "+1 per click", owned: clickPower },
                { type: "autoClicker", icon: FaCookieBite, name: "Auto Clicker", desc: "+1 cookie/sec", owned: autoClickers },
                { type: "factory", icon: FaIndustry, name: "Factory", desc: "+10 cookies/sec", owned: factories },
                { type: "megaFactory", icon: FaRocket, name: "Mega Factory", desc: "+100 cookies/sec", owned: megaFactories },
                { type: "lab", icon: FaBrain, name: "Lab", desc: "+500 cookies/sec", owned: labs },
                { type: "portal", icon: FaMagic, name: "Portal", desc: "+2,500 cookies/sec", owned: portals },
                { type: "timeMachine", icon: FaCrown, name: "Time Machine", desc: "+10,000 cookies/sec", owned: timeMachines },
                { type: "clickMultiplier", icon: FaGem, name: "Click Multiplier", desc: "x2 click power", owned: clickMultiplier },
                { type: "productionMultiplier", icon: FaStar, name: "Production Multiplier", desc: "x2 CPS", owned: productionMultiplier },
              ].map((u) => {
                const Icon = u.icon;
                const cost = getCost(u.type as UpgradeType, u.owned);
                return (
                  <button
                    key={u.type}
                    onClick={() => buyUpgrade(u.type as UpgradeType)}
                    disabled={cookies < cost}
                    className="w-full bg-linear-to-r from-blue-500 to-blue-600 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl p-4 transition-all hover:shadow-lg disabled:cursor-not-allowed flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={24} />
                      <div className="text-left">
                        <div className="font-bold">{u.name}</div>
                        <div className="text-xs opacity-90">{u.desc}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{cost.toLocaleString()}</div>
                      <div className="text-xs opacity-90">
                        {["clickPower", "clickMultiplier", "productionMultiplier"].includes(u.type)
                          ? `Level ${u.owned}`
                          : `Owned: ${u.owned}`}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-100px);
          }
        }
      `}</style>
    </div>
  );
}
