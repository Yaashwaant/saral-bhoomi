
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Banknote, Receipt } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface FinancialSummaryProps {
  totalIncome: number;
  totalExpenses: number;
  previousIncome?: number;
  previousExpenses?: number;
  period?: string;
  className?: string;
  onCardClick?: (type: 'income' | 'expenses' | 'balance') => void;
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  totalIncome,
  totalExpenses,
  previousIncome,
  previousExpenses,
  period = '',
  className = '',
  onCardClick
}) => {
  const isMobile = useIsMobile();
  
  const balance = totalIncome - totalExpenses;
  const previousBalance = previousIncome && previousExpenses 
    ? previousIncome - previousExpenses 
    : undefined;
  
  const getPercentChange = (current: number, previous: number | undefined) => {
    if (!previous) return null;
    return ((current - previous) / previous) * 100;
  };
  
  const incomeChange = getPercentChange(totalIncome, previousIncome);
  const expensesChange = getPercentChange(totalExpenses, previousExpenses);
  const balanceChange = getPercentChange(balance, previousBalance);
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 ${className}`}
    >
      <motion.div variants={item}>
        <Card 
          className={`bg-white hover:shadow-md transition-shadow ${onCardClick ? 'cursor-pointer' : ''}`} 
          onClick={() => onCardClick && onCardClick('income')}
        >
          <CardHeader className="pb-1 md:pb-2 px-3 md:px-6 pt-3 md:pt-6">
            <CardTitle className="text-base md:text-lg flex items-center">
              <Banknote className="h-4 w-4 md:h-5 md:w-5 mr-1.5 md:mr-2 text-green-500" />
              Revenus
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              {period ? `Total pour ${period}` : 'Total des entrées'}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <p className="text-xl md:text-2xl font-bold text-green-600">{totalIncome.toLocaleString('fr-FR', {
              style: 'currency',
              currency: 'EUR',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            })}</p>
            
            {incomeChange !== null && (
              <p className={`text-xs md:text-sm flex items-center ${
                incomeChange > 0 ? 'text-green-600' : incomeChange < 0 ? 'text-red-600' : 'text-muted-foreground'
              }`}>
                {incomeChange > 0 ? (
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                ) : incomeChange < 0 ? (
                  <TrendingDown className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                ) : null}
                {incomeChange > 0 ? '+' : ''}{incomeChange.toFixed(1)}%
                {!isMobile && " par rapport à la période précédente"}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div variants={item}>
        <Card 
          className={`bg-white hover:shadow-md transition-shadow ${onCardClick ? 'cursor-pointer' : ''}`} 
          onClick={() => onCardClick && onCardClick('expenses')}
        >
          <CardHeader className="pb-1 md:pb-2 px-3 md:px-6 pt-3 md:pt-6">
            <CardTitle className="text-base md:text-lg flex items-center">
              <Receipt className="h-4 w-4 md:h-5 md:w-5 mr-1.5 md:mr-2 text-red-500" />
              Dépenses
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              {period ? `Total pour ${period}` : 'Total des sorties'}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <p className="text-xl md:text-2xl font-bold text-red-600">{totalExpenses.toLocaleString('fr-FR', {
              style: 'currency',
              currency: 'EUR',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            })}</p>
            
            {expensesChange !== null && (
              <p className={`text-xs md:text-sm flex items-center ${
                expensesChange < 0 ? 'text-green-600' : expensesChange > 0 ? 'text-red-600' : 'text-muted-foreground'
              }`}>
                {expensesChange > 0 ? (
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                ) : expensesChange < 0 ? (
                  <TrendingDown className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                ) : null}
                {expensesChange > 0 ? '+' : ''}{expensesChange.toFixed(1)}%
                {!isMobile && " par rapport à la période précédente"}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div variants={item} className="sm:col-span-2 lg:col-span-1">
        <Card 
          className={`bg-white hover:shadow-md transition-shadow ${onCardClick ? 'cursor-pointer' : ''}`}
          onClick={() => onCardClick && onCardClick('balance')}
        >
          <CardHeader className="pb-1 md:pb-2 px-3 md:px-6 pt-3 md:pt-6">
            <CardTitle className="text-base md:text-lg flex items-center">
              <DollarSign className="h-4 w-4 md:h-5 md:w-5 mr-1.5 md:mr-2 text-blue-500" />
              Solde
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              {period ? `Bilan pour ${period}` : 'Revenus - Dépenses'}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <p className={`text-xl md:text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {balance.toLocaleString('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })}
            </p>
            
            {balanceChange !== null && (
              <p className={`text-xs md:text-sm flex items-center ${
                balanceChange > 0 ? 'text-green-600' : balanceChange < 0 ? 'text-red-600' : 'text-muted-foreground'
              }`}>
                {balanceChange > 0 ? (
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                ) : balanceChange < 0 ? (
                  <TrendingDown className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                ) : null}
                {balanceChange > 0 ? '+' : ''}{balanceChange.toFixed(1)}%
                {!isMobile && " par rapport à la période précédente"}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default FinancialSummary;
