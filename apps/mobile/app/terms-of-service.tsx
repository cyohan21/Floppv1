import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { config } from '../src/config/environment';

export default function TermsOfService() {
  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#6a12e4" />
      </TouchableOpacity>
      
      <Text style={styles.title}>Terms of Service</Text>
      <Text style={styles.meta}>Company: {config.appName} Inc.</Text>
      <Text style={styles.meta}>Contact: {config.appName.toLowerCase()}@example.com</Text>
      <Text style={styles.date}>Last updated: August 1, 2025</Text>

      <Text style={styles.text}>
        {config.appName} is a mobile app that helps users track and categorize spending, and gain AI-powered financial insights. Full features require a paid subscription.
      </Text>

      <Text style={styles.heading}>Acceptance of Terms</Text>
      <Text style={styles.text}>
        You must be at least 13 years old to use {config.appName}. By using the app, you confirm you meet this requirement.
      </Text>

      <Text style={styles.heading}>Account Requirements</Text>
      <Text style={styles.text}>
        - An account is required to use {config.appName}.{"\n"}
        - You are responsible for keeping your account secure.{"\n"}
        - You can cancel anytime via settings or by emailing {config.appName.toLowerCase()}@example.com.{"\n"}
        - We may terminate accounts that violate these terms.
      </Text>

      <Text style={styles.heading}>Acceptable Use</Text>
      <Text style={styles.text}>
        You agree not to:{"\n\n"}
        - Use {config.appName} for illegal or fraudulent purposes.{"\n"}
        - Attempt to hack or compromise our systems.{"\n"}
        - Share your account with others.{"\n"}
        - Use automated tools to access our services.
      </Text>

      <Text style={styles.heading}>Financial Services Disclaimer</Text>
      <Text style={styles.text}>
        {config.appName} strictly does not have access to your money or the ability to move funds.
        {"\n\n"}
        We provide financial tracking and insights only. We are not a bank, financial advisor, or investment service.
      </Text>

      <Text style={styles.heading}>Data and Privacy</Text>
      <Text style={styles.text}>
        Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information.
      </Text>

      <Text style={styles.heading}>Intellectual Property</Text>
      <Text style={styles.text}>
        All content and code belong to {config.appName} Inc. Do not reuse or reproduce our assets without written permission.
      </Text>

      <Text style={styles.heading}>Limitation of Liability</Text>
      <Text style={styles.text}>
        {config.appName} does not provide financial, tax, or legal advice. Use the app at your own risk. We do not guarantee specific financial results.
      </Text>

      <Text style={styles.heading}>Changes to Terms</Text>
      <Text style={styles.text}>
        We may update these terms from time to time. We will notify you of significant changes via email or in-app notification.
      </Text>

      <Text style={styles.heading}>Contact</Text>
      <Text style={styles.text}>
        Questions? Email us at {config.appName.toLowerCase()}@example.com or visit https://{config.appName.toLowerCase()}.com
      </Text>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#fff',
  },
  backButton: {
    marginBottom: 10,
    padding: 10,
  },
  title: {
    marginTop: 70,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
    color: '#000',
  },
  meta: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  section: {
    marginTop: 25,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
    color: '#111',
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
});
