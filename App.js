import React, { useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BudgetProvider } from "./BudgetContext";
import JournalScreen from "./JournalScreen";
import SubscriptionScreen from "./SubscriptionScreen";

const tabs = [
  { key: "journal", label: "Journal" },
  { key: "subscriptions", label: "Abonnements" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("journal");

  const renderScreen = () => {
    if (activeTab === "subscriptions") {
      return <SubscriptionScreen />;
    }
    return <JournalScreen />;
  };

  return (
    <BudgetProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F7EFE2" />
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Budget Pastel</Text>
          </View>
          <View style={styles.tabBar}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tabButton,
                  activeTab === tab.key && styles.tabButtonActive,
                ]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === tab.key && styles.tabLabelActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.screenContainer}>{renderScreen()}</View>
        </View>
      </SafeAreaView>
    </BudgetProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7EFE2",
  },
  container: {
    flex: 1,
    backgroundColor: "#F7EFE2",
  },
  header: {
    paddingVertical: 20,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#4A4A4A",
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#FFF5E8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 6,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: {
    backgroundColor: "#F4D3E2",
  },
  tabLabel: {
    fontSize: 16,
    color: "#6B6B6B",
  },
  tabLabelActive: {
    color: "#3B3B3B",
    fontWeight: "700",
  },
  screenContainer: {
    flex: 1,
    padding: 16,
  },
});
