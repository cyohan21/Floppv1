import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { config } from '../src/config/environment';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Text style={styles.sectionText}>{children}</Text>
  </View>
);

export default function About() {
  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#6a12e4" />
      </TouchableOpacity>
      
      <Text style={styles.title}>About {config.appName}</Text>
      
      <Section title="What is {config.appName}?">
        {config.appName} is a smart mobile spending tracker that helps you take control of your finances — with a swipe.
      </Section>

      <Section title="Our Mission">
        We believe managing your money should be simple, intuitive, and a little entertaining. {config.appName} was created to help young adults, students, and families build awareness of their spending without spreadsheets or stress.
      </Section>

      <Section title="What Makes {config.appName} Different">
        • Smart categorization with AI{"\n"}
        • Beautiful, intuitive interface{"\n"}
        • Real-time spending insights{"\n"}
        • Secure bank connections{"\n"}
        • No hidden fees or subscriptions
      </Section>

      <Section title="About the Team">
        {config.appName} is developed by {config.appName} Inc., and focused on creating playful, powerful tools for personal finance. We're a small team with a big vision for helping people build better financial habits.
      </Section>

      <View style={styles.contactSection}>
        <Text style={styles.contactTitle}>Get in Touch</Text>
        <Text style={styles.contactText}>
          📧 {config.appName.toLowerCase()}@example.com{"\n"}
          🌐 https://{config.appName.toLowerCase()}.com
        </Text>
        <TouchableOpacity 
          style={styles.link} 
          onPress={() => Linking.openURL(`mailto:${config.appName.toLowerCase()}@example.com`)}
        >
          <Text style={styles.linkText}>Send us an email</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#fff',
  },
  backButton: {
    marginBottom: 20,
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
  section: {
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
    color: '#111',
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  contactSection: {
    marginTop: 25,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
    color: '#111',
  },
  contactText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginBottom: 10,
  },
  link: {
    marginTop: 10,
    fontSize: 16,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  linkText: {
    fontSize: 16,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});
