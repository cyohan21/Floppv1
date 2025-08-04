import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { config } from '../src/config/environment';

export default function PrivacyPolicy() {
  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#6a12e4" />
      </TouchableOpacity>
      
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.meta}>Company: {config.appName} Inc.</Text>
      <Text style={styles.meta}>Contact: {config.appName.toLowerCase()}@example.com</Text>
      <Text style={styles.date}>Last updated: August 1, 2025</Text>

      <Text style={styles.text}>
        This Privacy Policy explains how we collect, use, store, and share your data when you use {config.appName}.com ("{config.appName}", "we", "our", or "us"). By using the app, you agree to this policy.
      </Text>

      <Text style={styles.heading}>Information We Collect</Text>
      <Text style={styles.text}>
        When you use {config.appName}, we may collect the following types of information:
        {"\n\n"}
        • Account information (name, email, username){"\n"}
        • Financial data from your connected bank accounts{"\n"}
        • Transaction history and categorization{"\n"}
        • App usage and preferences{"\n"}
        • Device information and analytics
      </Text>

      <Text style={styles.heading}>How We Use Your Information</Text>
      <Text style={styles.text}>
        We use your information to:{"\n\n"}
        • Provide and improve our services{"\n"}
        • Process transactions and categorize spending{"\n"}
        • Send important updates and notifications{"\n"}
        • Ensure security and prevent fraud{"\n"}
        • Provide customer support
      </Text>

      <Text style={styles.heading}>Data Sharing</Text>
      <Text style={styles.text}>
        We do not sell your personal information. We may share data with:{"\n\n"}
        • Plaid (for secure bank connections){"\n"}
        • Service providers (hosting, analytics){"\n"}
        • Legal authorities when required by law
      </Text>

      <Text style={styles.heading}>Your Rights</Text>
      <Text style={styles.text}>
        You have the right to:{"\n\n"}
        • Access and update your information{"\n"}
        • Delete your account and data{"\n"}
        • Opt out of marketing communications{"\n"}
        • Request data portability
        {"\n\n"}
        You can delete your account anytime via settings or by emailing {config.appName.toLowerCase()}@example.com.
      </Text>

      <Text style={styles.heading}>Data Security</Text>
      <Text style={styles.text}>
        We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure.
      </Text>

      <Text style={styles.heading}>Children's Privacy</Text>
      <Text style={styles.text}>
        {config.appName} is not intended for children under 13.{"\n"}
        We do not knowingly collect personal information from children under 13.
      </Text>

      <Text style={styles.heading}>Changes to This Policy</Text>
      <Text style={styles.text}>
        We may update this privacy policy from time to time. We will notify you of any material changes via email or in-app notification.
      </Text>

      <Text style={styles.heading}>Contact Us</Text>
      <Text style={styles.text}>
        Questions? Email us at {config.appName.toLowerCase()}@example.com
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
