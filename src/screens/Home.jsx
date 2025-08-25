import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function Home() {
  const navigator = useNavigation();
  const [selectedStat, setSelectedStat] = useState(0);

  const stats = [
    { number: '1.2M+', label: 'Meals Distributed', color: '#2563eb' },
    { number: '350+', label: 'Partner Organizations', color: '#059669' },
    { number: '75+', label: 'Communities Served', color: '#dc2626' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Hero Section */}
      <View style={styles.hero}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1593113616828-6f22bce62113?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          }}
          style={styles.heroImage}
        />
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTitle}>Zero Hunger Initiative</Text>
          <Text style={styles.heroSubtitle}>
            Sustainable Food Distribution Solutions
          </Text>
        </View>
      </View>

      {/* Mission Statement */}
      <View style={styles.missionSection}>
        <Text style={styles.sectionTitle}>Our Mission</Text>
        <Text style={styles.missionText}>
          We leverage technology and strategic partnerships to eliminate food
          waste while addressing hunger in communities worldwide through
          efficient distribution networks and sustainable practices.
        </Text>
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsSection}>
        <Text style={styles.sectionTitle}>Impact Metrics</Text>
        <View style={styles.metricsContainer}>
          {stats.map((stat, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.metricCard,
                {
                  backgroundColor:
                    selectedStat === index ? stat.color : '#ffffff',
                  borderColor: stat.color,
                },
              ]}
              onPress={() => setSelectedStat(index)}
            >
              <Text
                style={[
                  styles.metricNumber,
                  { color: selectedStat === index ? '#ffffff' : stat.color },
                ]}
              >
                {stat.number}
              </Text>
              <Text
                style={[
                  styles.metricLabel,
                  { color: selectedStat === index ? '#ffffff' : '#64748b' },
                ]}
              >
                {stat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Services */}
      <View style={styles.servicesSection}>
        <Text style={styles.sectionTitle}>Our Services</Text>

        <TouchableOpacity
          style={[styles.serviceCard, styles.primaryService]}
          onPress={() => navigator.navigate('signup')}
        >
          <View style={styles.serviceContent}>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceTitle}>Individual Registration</Text>
              <Text style={styles.serviceDescription}>
                Join our platform to volunteer or access food assistance
                programs in your community
              </Text>
            </View>
            <View style={styles.serviceArrow}>
              <Text style={styles.arrowText}>›</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.serviceCard, styles.secondaryService]}
          onPress={() => navigator.navigate('createOrganization')}
        >
          <View style={styles.serviceContent}>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceTitle}>Organization Partnership</Text>
              <Text style={styles.serviceDescription}>
                Register your organization to coordinate donation efforts and
                resource management
              </Text>
            </View>
            <View style={styles.serviceArrow}>
              <Text style={styles.arrowText}>›</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.serviceCard, styles.secondaryService]}
          onPress={() => navigator.navigate('organization')}
        >
          <View style={styles.serviceContent}>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceTitle}>Organization </Text>
              <Text style={styles.serviceDescription}>
                Your organization can coordinate donation efforts and resource
                management
              </Text>
            </View>
            <View style={styles.serviceArrow}>
              <Text style={styles.arrowText}>›</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.serviceCard, styles.secondaryService]}
          onPress={() => navigator.navigate('organizations')}
        >
          <View style={styles.serviceContent}>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceTitle}>Organizations</Text>
              <Text style={styles.serviceDescription}>
                Your organization can coordinate donation efforts and resource
                management
              </Text>
            </View>
            <View style={styles.serviceArrow}>
              <Text style={styles.arrowText}>›</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.serviceCard, styles.tertiaryService]}
          onPress={() => navigator.navigate('restaurantList')}
        >
          <View style={styles.serviceContent}>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceTitle}>Partner Network</Text>
              <Text style={styles.serviceDescription}>
                Access our network of restaurants and food service partners
              </Text>
            </View>
            <View style={styles.serviceArrow}>
              <Text style={styles.arrowText}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Call to Action */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>Make an Impact Today</Text>
        <Text style={styles.ctaDescription}>
          Join thousands of individuals and organizations working together to
          create sustainable solutions for food security
        </Text>
        <TouchableOpacity style={styles.ctaButton}>
          <Text style={styles.ctaButtonText}>Support Our Mission</Text>
        </TouchableOpacity>
      </View>

      {/* Live Statistics */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Real-Time Impact</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>2,847</Text>
            <Text style={styles.statDescription}>Meals Distributed Today</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>1,205</Text>
            <Text style={styles.statDescription}>Individuals Served</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>890kg</Text>
            <Text style={styles.statDescription}>Food Waste Prevented</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>156</Text>
            <Text style={styles.statDescription}>Active Volunteers</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  hero: {
    height: 280,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    padding: 24,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '400',
  },
  missionSection: {
    padding: 24,
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  missionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#475569',
    fontWeight: '400',
  },
  metricsSection: {
    padding: 24,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  metricNumber: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  servicesSection: {
    padding: 24,
  },
  serviceCard: {
    borderRadius: 8,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  primaryService: {
    backgroundColor: '#2563eb',
  },
  secondaryService: {
    backgroundColor: '#059669',
  },
  tertiaryService: {
    backgroundColor: '#7c3aed',
  },
  serviceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 6,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#e2e8f0',
    lineHeight: 20,
    fontWeight: '400',
  },
  serviceArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  ctaSection: {
    backgroundColor: '#1e293b',
    padding: 32,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  ctaTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  ctaDescription: {
    color: '#cbd5e1',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '400',
  },
  ctaButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 6,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsSection: {
    padding: 24,
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  statDescription: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },
});
