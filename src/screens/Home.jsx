import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// Green Color Palette
const Colors = {
  primary: '#10B981',     // Emerald Green
  secondary: '#059669',   // Darker Emerald
  accent: '#34D399',      // Light Emerald
  background: '#ECFDF5',  // Light green background
  surface: '#FFFFFF',     // Cards
  textPrimary: '#064E3B', // Dark green
  textSecondary: '#047857',
  textTertiary: '#6B7280',
  border: '#D1FAE5',
};

// Feature Cards Data
const featureCards = [
  {
    title: 'Register Individual',
    description: 'Join as a volunteer',
    icon: 'user-plus',
    color: '#10B981',
    route: 'volunteerSection'
  },
  {
    title: 'Create Organization',
    description: 'Start your food initiative',
    icon: 'briefcase',
    color: '#059669',
    route: 'createOrganization'
  },
  {
    title: 'Donor Network',
    description: 'Connect with food donors',
    icon: 'heart',
    color: '#34D399',
    route: { screen: 'tabs', params: { screen: 'Donors' } }
  },
  {
    title: 'Partner Map',
    description: 'Find nearby organizations',
    icon: 'map',
    color: '#10B981',
    route: 'organizations'
  },
];

// Quick Stats
const quickStats = [
  { value: '1.2M+', label: 'Meals Served', change: '+12%' },
  { value: '350+', label: 'Partner Orgs', change: '+5%' },
  { value: '5K+', label: 'Volunteers', change: '+8%' },
];

// Clickable Links
const quickLinks = [
  {
    title: 'Our Mission & Story',
    icon: 'target',
    route: 'aboutScreen'
  },
  {
    title: 'Partner Organizations',
    icon: 'users',
    route: 'organizations'
  },
  {
    title: 'Get Assistance',
    icon: 'help-circle',
    route: 'assistance'
  },
  {
    title: 'Community Forum',
    icon: 'message-circle',
    route: 'community'
  },
];

export default function Home() {
  const navigation = useNavigation();

  const navigateToRoute = (route) => {
    if (typeof route === 'string') {
      navigation.navigate(route);
    } else {
      navigation.navigate(route.screen, route.params);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Welcome to</Text>
              <Text style={styles.appName}>Zero Hunger Initiative</Text>
              <Text style={styles.tagline}>Your platform for food distribution and waste reduction</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('profile')}
            >
              <Feather name="user" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          {quickStats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <View style={styles.changeContainer}>
                <Feather name="trending-up" size={12} color={Colors.secondary} />
                <Text style={styles.changeText}>{stat.change}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.featuresGrid}>
            {featureCards.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.featureCard}
                onPress={() => navigateToRoute(item.route)}
              >
                <LinearGradient
                  colors={[`${item.color}15`, `${item.color}08`]}
                  style={[styles.featureIcon, { borderLeftColor: item.color }]}
                >
                  <Feather name={item.icon} size={24} color={item.color} />
                </LinearGradient>
                <Text style={styles.featureTitle}>{item.title}</Text>
                <Text style={styles.featureDescription}>{item.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Today's Impact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Impact</Text>
          <LinearGradient
            colors={['#FFFFFF', '#ECFDF5']}
            style={styles.highlightCard}
          >
            <View style={styles.highlightContent}>
              <View style={styles.highlightText}>
                <View style={styles.metricRow}>
                  <View style={styles.metricItem}>
                    <Feather name="package" size={20} color={Colors.primary} />
                    <View style={styles.metricText}>
                      <Text style={styles.metricValue}>2,847</Text>
                      <Text style={styles.metricLabel}>Meals Distributed</Text>
                    </View>
                  </View>
                  <View style={styles.metricItem}>
                    <Feather name="refresh-cw" size={20} color={Colors.secondary} />
                    <View style={styles.metricText}>
                      <Text style={styles.metricValue}>890kg</Text>
                      <Text style={styles.metricLabel}>Waste Prevented</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.volunteerInfo}>
                  <Feather name="users" size={14} color={Colors.textTertiary} />
                  <Text style={styles.volunteerText}>127 active volunteers today</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.joinButton}
                onPress={() => navigation.navigate('volunteerSection')}
              >
                <Text style={styles.joinButtonText}>Join Today</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <View style={styles.linksGrid}>
            {quickLinks.map((item, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.linkCard}
                onPress={() => navigateToRoute(item.route)}
              >
                <View style={styles.linkIcon}>
                  <Feather name={item.icon} size={20} color={Colors.primary} />
                </View>
                <Text style={styles.linkTitle}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Call to Action */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.ctaCard}
            onPress={() => navigation.navigate('volunteerSection')}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.ctaGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.ctaContent}>
                <View>
                  <Text style={styles.ctaTitle}>Ready to Make a Difference?</Text>
                  <Text style={styles.ctaSubtitle}>Join our volunteer community today</Text>
                </View>
                <Feather name="arrow-right" size={20} color="#FFFFFF" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacer */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Floating Support Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('chatbotScreen')}
      >
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Feather name="message-circle" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    marginBottom: 4,
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  tagline: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: -20,
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
    textAlign: 'center',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 11,
    color: Colors.secondary,
    fontWeight: '600',
    marginLeft: 2,
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: (width - 56) / 2,
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderLeftWidth: 3,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  highlightCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  highlightContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  highlightText: {
    flex: 1,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    marginLeft: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  volunteerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  volunteerText: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginLeft: 6,
  },
  joinButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginLeft: 16,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  linksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  linkCard: {
    width: (width - 56) / 2,
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  ctaCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaGradient: {
    padding: 24,
  },
  ctaContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  ctaSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  spacer: {
    height: 40,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});