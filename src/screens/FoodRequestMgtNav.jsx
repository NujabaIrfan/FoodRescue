import React, { useEffect, useState } from 'react';
import { auth, db } from '../../firebaseConfig';
import {
  KeyboardAvoidingView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { onAuthStateChanged } from 'firebase/auth';

const FoodRequestMgtNav = () => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigation = useNavigation();

    useEffect(()=>{
        const unsubscribe=onAuthStateChanged(auth, (user)=>{
            if(user){
                navigation.navigate("Home")
            }
        })
        return unsubscribe
    }, []);



  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      

      <View style={styles.buttonContainer}>
        

        {/* temporary button */}
      <TouchableOpacity
          onPress={()=>navigation.navigate('createFoodRequest')}
          style={[styles.button, styles.buttonOutline]}
        >
          <Text style={styles.buttonOutlineText}>Request food</Text>
        </TouchableOpacity>

        {/* temporary button */}
      {/* <TouchableOpacity
          onPress={()=>navigation.navigate('displayFoodRequest')}
          style={[styles.button, styles.buttonOutline]}
        >
          <Text style={styles.buttonOutlineText}>View Request Details</Text>
        </TouchableOpacity> */}
      

      {/* temporary button */}
      <TouchableOpacity
          onPress={()=>navigation.navigate('displayRequestAdminInterface')}
          style={[styles.button, styles.buttonOutline]}
        >
          <Text style={styles.buttonOutlineText}>Approve Requests</Text>
        </TouchableOpacity>

        {/* temporary button */}
      <TouchableOpacity
          onPress={()=>navigation.navigate('foodRequestListScreen')}
          style={[styles.button, styles.buttonOutline]}
        >
          <Text style={styles.buttonOutlineText}>View All Requests</Text>
        </TouchableOpacity>
      </View>


      
    </KeyboardAvoidingView>
  );
};

export default FoodRequestMgtNav;

const styles = StyleSheet.create({
    container:{
        flex:1,
        justifyContent:'center',
        alignItems:'center',
    },
    button:{
        backgroundColor: '#a1b8cfff',
        width:'60%',
        padding: 15,
        borderRadius:10,
        alignItems:'center',
        marginTop:40
    },
    buttonText:{
        color:'white',
        fontWeight:'700',
        fontSize:16
    }
})
