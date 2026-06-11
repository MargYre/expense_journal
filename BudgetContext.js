import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  expenses: "budget_expenses",
  categories: "budget_categories",
  subscriptions: "budget_subscriptions",
  lastRollMonth: "budget_last_roll_month",
};

const defaultCategories = [
  { id: "cat-alimentation", nom: "Alimentation", couleurHex: "#F8B8D2" },
  { id: "cat-transport", nom: "Transport", couleurHex: "#A4D8F0" },
  { id: "cat-sorties", nom: "Sorties", couleurHex: "#F7E9A8" },
  { id: "cat-abonnements", nom: "Abonnements", couleurHex: "#C3A4F0" },
];

export const BudgetContext = createContext(undefined);

export const BudgetProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState(defaultCategories);
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getCurrentMonthKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}`;
  };

  const getFirstOfCurrentMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  };

  const saveAll = async (nextExpenses, nextCategories, nextSubscriptions, nextMonthKey) => {
    try {
      const entries = [
        [STORAGE_KEYS.expenses, JSON.stringify(nextExpenses)],
        [STORAGE_KEYS.categories, JSON.stringify(nextCategories)],
        [STORAGE_KEYS.subscriptions, JSON.stringify(nextSubscriptions)],
      ];
      if (nextMonthKey) entries.push([STORAGE_KEYS.lastRollMonth, nextMonthKey]);
      await AsyncStorage.multiSet(entries);
    } catch (error) {
      console.error("BudgetContext saveAll error", error);
    }
  };

  const loadData = async () => {
    try {
      const values = await AsyncStorage.multiGet([
        STORAGE_KEYS.expenses,
        STORAGE_KEYS.categories,
        STORAGE_KEYS.subscriptions,
        STORAGE_KEYS.lastRollMonth,
      ]);

      const stored = values.reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});

      const loadedExpenses = stored[STORAGE_KEYS.expenses]
        ? JSON.parse(stored[STORAGE_KEYS.expenses])
        : [];
      const loadedCategories = stored[STORAGE_KEYS.categories]
        ? JSON.parse(stored[STORAGE_KEYS.categories])
        : defaultCategories;
      const loadedSubscriptions = stored[STORAGE_KEYS.subscriptions]
        ? JSON.parse(stored[STORAGE_KEYS.subscriptions])
        : [];
      const lastRollMonth = stored[STORAGE_KEYS.lastRollMonth] || null;
      const currentMonthKey = getCurrentMonthKey();

      const hasNewMonth = lastRollMonth !== currentMonthKey;

      if (hasNewMonth && loadedSubscriptions.length > 0) {
        const firstOfMonth = getFirstOfCurrentMonth();
        const newSubscriptionsAsExpenses = loadedSubscriptions
          .filter((item) => item.actif)
          .map((subscription) => ({
            id: `sub-${subscription.id}-${currentMonthKey}`,
            montant: subscription.montant,
            categorieId: subscription.categorieId,
            descriptionJournal: `Abonnement ${subscription.nom}`,
            date: firstOfMonth,
          }));

        const mergedExpenses = [...loadedExpenses, ...newSubscriptionsAsExpenses];
        setExpenses(mergedExpenses);
        setCategories(loadedCategories.length ? loadedCategories : defaultCategories);
        setSubscriptions(loadedSubscriptions);
        await saveAll(mergedExpenses, loadedCategories.length ? loadedCategories : defaultCategories, loadedSubscriptions, currentMonthKey);
      } else {
        setExpenses(loadedExpenses);
        setCategories(loadedCategories.length ? loadedCategories : defaultCategories);
        setSubscriptions(loadedSubscriptions);
        if (!lastRollMonth) {
          await AsyncStorage.setItem(STORAGE_KEYS.lastRollMonth, currentMonthKey);
        }
      }
    } catch (error) {
      console.error("BudgetContext loadData error", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addExpense = async ({ montant, categorieId, descriptionJournal, date }) => {
    const nextExpense = {
      id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      montant,
      categorieId,
      descriptionJournal,
      date: date || new Date().toISOString(),
    };
    const nextExpenses = [...expenses, nextExpense];
    setExpenses(nextExpenses);
    await saveAll(nextExpenses, categories, subscriptions, getCurrentMonthKey());
    return nextExpense;
  };

  const removeExpense = async (expenseId) => {
    const nextExpenses = expenses.filter((expense) => expense.id !== expenseId);
    setExpenses(nextExpenses);
    await saveAll(nextExpenses, categories, subscriptions, getCurrentMonthKey());
  };

  const addCategory = async ({ nom, couleurHex }) => {
    const nextCategory = {
      id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      nom,
      couleurHex,
    };
    const nextCategories = [...categories, nextCategory];
    setCategories(nextCategories);
    await saveAll(expenses, nextCategories, subscriptions, getCurrentMonthKey());
    return nextCategory;
  };

  const addSubscription = async ({ nom, montant, categorieId, actif = true }) => {
    const nextSubscription = {
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      nom,
      montant,
      categorieId,
      actif,
    };
    const nextSubscriptions = [...subscriptions, nextSubscription];
    setSubscriptions(nextSubscriptions);
    await saveAll(expenses, categories, nextSubscriptions, getCurrentMonthKey());
    return nextSubscription;
  };

  const updateSubscriptionStatus = async (subscriptionId, actif) => {
    const nextSubscriptions = subscriptions.map((item) =>
      item.id === subscriptionId ? { ...item, actif } : item,
    );
    setSubscriptions(nextSubscriptions);
    await saveAll(expenses, categories, nextSubscriptions, getCurrentMonthKey());
  };

  const getCategoryName = (categorieId) => {
    const category = categories.find((item) => item.id === categorieId);
    return category ? category.nom : "Autre";
  };

  const getStartOfWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
  };

  const isSameMonth = (dateString) => {
    const itemDate = new Date(dateString);
    const now = new Date();
    return itemDate.getFullYear() === now.getFullYear() && itemDate.getMonth() === now.getMonth();
  };

  const isInCurrentWeek = (dateString) => {
    const itemDate = new Date(dateString);
    const startOfWeek = getStartOfWeek();
    const now = new Date();
    return itemDate >= new Date(startOfWeek.setHours(0, 0, 0, 0)) && itemDate <= new Date(now.setHours(23, 59, 59, 999));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const generateAIPrompt = (periode = "semaine") => {
    const filteredExpenses = expenses
      .filter((expense) =>
        periode === "mois" ? isSameMonth(expense.date) : isInCurrentWeek(expense.date),
      )
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (!filteredExpenses.length) {
      return periode === "mois"
        ? "Aucune dépense trouvée pour le mois en cours."
        : "Aucune dépense trouvée pour la semaine en cours.";
    }

    const header = periode === "mois"
      ? "Dépenses du mois en cours :\n"
      : "Dépenses de la semaine en cours :\n";

    const lines = filteredExpenses.map((expense) => {
      const dateLabel = formatDate(expense.date);
      const categoryName = getCategoryName(expense.categorieId);
      return `- ${expense.montant}€ · ${categoryName} · ${dateLabel} · Pense-bête : ${expense.descriptionJournal}`;
    });

    return `${header}${lines.join("\n")}`;
  };

  return (
    <BudgetContext.Provider
      value={{
        expenses,
        categories,
        subscriptions,
        isLoading,
        addExpense,
        removeExpense,
        addCategory,
        addSubscription,
        updateSubscriptionStatus,
        generateAIPrompt,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error("useBudget must be used within a BudgetProvider");
  }
  return context;
};
