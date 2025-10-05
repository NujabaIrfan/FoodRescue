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
        headerShown: false,
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
    tabs: BottomTabs,
    home: Home,
    createOrganization: CreateOrganization,
    signup: Signup,
    restaurantList: RestaurantList,
    organizations: Organizations,
    organization: Organization,
    createEvent: CreateEvent,
    donorSignUp: DonorSignUp,
    donorSignIn: DonorSignIn,
    forgotPassword: ForgotPassword,
    donorProfile: DonorProfile,
    volunteerSignUp: VolunteerSignUp,
    volunteerLogin: VolunteerLogin,
    volunteerSection: VolunteerSection,
    volunteerProfile: VolunteerProfile,
    createFoodRequest: CreateFoodRequest,
    foodRequestMgtNav: FoodRequestMgtNav,
    displayFoodRequest: DisplayFoodRequest,
    displayRequestAdminInterface: DisplayRequestAdminInterface,
    foodRequestListScreen: FoodRequestListScreen,
    chatbotScreen: ChatbotScreen,
    surplus: Surplus,
    surplusList: SurplusList,
    organizationVolunteers: OrganizationVolunteers,
    organizationEvents: OrganizationEvents,
    volunteerForgotPassword: VolunteerForgotPassword,
    donorFoodRequest: DonorFoodRequest
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
