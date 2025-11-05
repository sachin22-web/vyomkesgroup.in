import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Home, Building, TrendingUp, DollarSign, PlusCircle, Bitcoin, LandPlot, Factory, WalletMinimal, Handshake, PiggyBank } from 'lucide-react'; // Updated icons

const categories = [
  { name: 'Real Estate Buy', icon: Home, link: '/real-estate-buy' },
  { name: 'Real Estate Sell', icon: LandPlot, link: '/real-estate-sell' },
  { name: 'Stock Investments', icon: TrendingUp, link: '/stock-investments' },
  { name: 'SIP Investments', icon: PiggyBank, link: '/sip-investments' },
  { name: 'Crypto Investments', icon: Bitcoin, link: '/crypto-investments' },
  { name: 'New Projects', icon: Factory, link: '/new-projects' },
  { name: 'My Wallet', icon: WalletMinimal, link: '/app/wallet' }, // Link to user wallet
];

export default function CategoryNav() {
  return (
    <div className="container py-8">
      <div className="flex overflow-x-auto space-x-4 pb-2 scrollbar-hide">
        {categories.map((category) => (
          <Link to={category.link} key={category.name} className="flex-shrink-0">
            <Card className="w-32 h-32 flex flex-col items-center justify-center text-center p-4 hover:bg-accent/50 transition-colors">
              <category.icon className="h-8 w-8 text-primary mb-2" />
              <p className="text-sm font-medium">{category.name}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}