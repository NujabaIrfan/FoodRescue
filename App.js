import { StyleSheet } from 'react-native';
import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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

const RootStack = createNativeStackNavigator({
  initialRouteName: 'home',
  screens: {
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
    volunteerSignUp : VolunteerSignUp,
    volunteerLogin : VolunteerLogin,
    volunteerSection : VolunteerSection,
    volunteerProfile : VolunteerProfile,
    createFoodRequest: CreateFoodRequest,
    foodRequestMgtNav:FoodRequestMgtNav,
    displayFoodRequest:DisplayFoodRequest,
    displayRequestAdminInterface:DisplayRequestAdminInterface,
    foodRequestListScreen:FoodRequestListScreen,
    chatbotScreen: ChatbotScreen,
    surplus:Surplus,
    surplusList:SurplusList,
    organizationVolunteers: OrganizationVolunteers
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
