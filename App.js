import { StyleSheet } from 'react-native';
import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CreateOrganization from './src/screens/CreateOrganization';
import Home from './src/screens/Home';
import Signup from './src/screens/Signup';
import RestaurantList from './src/screens/RestaurantList';
import Organizations from './src/screens/Organizations';
import Organization from './src/screens/Organization';
import DonorSignUp from './src/screens/DonorSignUp';
import Toast from 'react-native-toast-message';
import CreateEvent from './src/screens/CreateEvent';
import VolunteerLogin from './src/screens/VolunteerLogin';
import VolunteerSection from './src/screens/VolunteerSection';
import VolunteerProfile from './src/screens/VolunteerProfile';
import DonorSignIn from './src/screens/DonorSignIn';
import VolunteerSignUp from './src/screens/VolunteerSignUp';
import CreateFoodRequest from './src/screens/CreateFoodRequest';
import FoodRequestMgtNav from './src/screens/FoodRequestMgtNav';
import DisplayFoodRequest from './src/screens/DisplayFoodRequest';
import DisplayRequestAdminInterface from './src/screens/DisplayRequestsAdminInterface';
import FoodRequestListScreen from './src/screens/FoodRequestListScreen';
import ForgotPassword from './src/screens/ForgotPasswordDonor';
import DonorProfile from './src/screens/DonorProfile';
import Surplus from './src/screens/Surplus';
import SurplusList from './src/screens/SurplusList';
import ChatbotScreen from './src/screens/ChatbotScreen';
import OrganizationVolunteers from './src/screens/OrganizationVolunteers';
import OrganizationEvents from './src/screens/OrganizationEvents';
import VolunteerForgotPassword from './src/screens/VolunteerForgotPassword';
import DonorFoodRequest from './src/screens/DonorFoodRequest';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome6';


const Tab = createBottomTabNavigator()

function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // Header shown for individual tab screens
        headerShown: true, 
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Home') {
            return <MaterialIcon name="home" size={32} color={color} />;
          } else if (route.name === 'NGO') {
            return <MaterialIcon name="apartment" size={32} color={color} />;
          } else if (route.name === 'Donors') {
            return <MaterialIcon name="food-bank" size={32} color={color} />
          } else if (route.name === 'Volunteer') {
            return <MaterialIcon name="volunteer-activism" size={32} color={color} />
          }
        },
        tabBarActiveTintColor: '#389C9A',
        tabBarInactiveTintColor: 'gray',
        tabBarLabelStyle: {
          fontSize: 14,
          marginBottom: 4,
        },
        tabBarStyle: {
          height: 70,
          paddingTop: 6,
        },
        animation: 'shift',
      })}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="NGO" component={Organizations} />
      <Tab.Screen name="Donors" component={RestaurantList} />
      <Tab.Screen name="Volunteer" component={VolunteerSection} />
    </Tab.Navigator>
  );
}


const RootStack = createNativeStackNavigator({
  initialRouteName: 'tabs',
  screens: {
    // Hide the stack header for the 'tabs' screen itself
    tabs: {
        screen: BottomTabs,
        options: {
            headerShown: false,
        },
    },
    // All these screens are outside the tab navigator and will cover the tabs,
    // and they will have a header shown by default to allow back navigation.
    home: { screen: Home },
    createOrganization: { screen: CreateOrganization },
    signup: { screen: Signup },
    organizations: { screen: Organizations },
    organization: { screen: Organization },
    createEvent: { screen: CreateEvent },
    donorSignUp: { screen: DonorSignUp },
    donorSignIn: { screen: DonorSignIn },
    forgotPassword: { screen: ForgotPassword },
    donorProfile: { screen: DonorProfile },
    volunteerSignUp: { screen: VolunteerSignUp },
    volunteerLogin: { screen: VolunteerLogin },
    volunteerSection: { screen: VolunteerSection },
    volunteerProfile: { screen: VolunteerProfile },
    createFoodRequest: { screen: CreateFoodRequest },
    foodRequestMgtNav: { screen: FoodRequestMgtNav },
    displayFoodRequest: { screen: DisplayFoodRequest },
    displayRequestAdminInterface: { screen: DisplayRequestAdminInterface },
    foodRequestListScreen: { screen: FoodRequestListScreen },
    chatbotScreen: { screen: ChatbotScreen },
    surplus: { screen: Surplus },
    surplusList: { screen: SurplusList },
    organizationVolunteers: { screen: OrganizationVolunteers },
    organizationEvents: { screen: OrganizationEvents },
    volunteerForgotPassword: { screen: VolunteerForgotPassword },
    donorFoodRequest: { screen: DonorFoodRequest }
  },
});

const Navigation = createStaticNavigation(RootStack);

export default function App() {
  return (
    <>
      <Navigation />
      <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
