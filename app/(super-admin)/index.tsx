import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Text } from 'react-native';

export default function AdminDashboard() {
  const adminSections = [
    {
      title: 'Restaurants',
      description: 'Manage restaurants and their details',
      route: '/restaurants',
      icon: '🏪',
    },
    {
      title: 'Companies',
      description: 'Manage company profiles and details',
      route: '/companies',
      icon: '🏢',
    },
    {
      title: 'Company Memberships',
      description: 'Manage company subscriptions and access',
      route: '/memberships',
      icon: '👥',
    },
    {
      title: 'Users',
      description: 'Manage users, roles, and send invitations',
      route: '/users',
      icon: '👤',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Admin Dashboard</Text>
      <View style={styles.grid}>
        {adminSections.map((section) => (
          <Link
            key={section.route}
            href={`/(super-admin)${section.route}` as any}
            asChild
          >
            <TouchableOpacity style={styles.card}>
              <Text style={styles.icon}>{section.icon}</Text>
              <Text style={styles.title}>{section.title}</Text>
              <Text style={styles.description}>{section.description}</Text>
            </TouchableOpacity>
          </Link>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    width: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    fontSize: 32,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
});
