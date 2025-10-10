import { deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, Image, Platform, Text, TextInput, TouchableOpacity } from "react-native";
import { ScrollView, StyleSheet, View } from "react-native";
import { db, auth } from "../../firebaseConfig";
import Toast from "react-native-toast-message";
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from "@react-navigation/native";

export default function OrganizationSettings({ route }) {

  const { id } = route.params
  const navigator = useNavigation()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState(require('../../assets/default-image.jpg'));

  useEffect(() => {
    (async () => {
      const res = await getDoc(doc(db, "Organizations", id))
      const data = res.data()
      if (data) {
        setName(data.name)
        setDescription(data.description)
        if (data.image) setImage(data.image)
      }
    })()
  }, [id])

  const updateInformation = async () => {

    const { currentUser } = auth;
    if (!currentUser) return Toast.show({
      type: "error",
      text1: "You must log in to perform this action",
      position: 'top'
    });
    if (!name.trim()) return Toast.show({
      type: "error",
      text1: "Please provide a valid name for your organization",
      position: "top"
    });
    if (!description.trim()) return Toast.show({
      type: "error",
      text1: "Please provide a valid description for your organization",
      position: "top"
    })

    try {
      await updateDoc(doc(db, "Organizations", id), { name, description })
      Toast.show({
        type: "success",
        text1: "Information updated!"
      })
    } catch (error) {
      console.error(error)
      Toast.show({
        type: "error",
        text1: "Update failed!",
      })
    }
  }

  const uploadImage = async () => {
    let res = await launchImageLibrary({
      mediaType: 'photo',
      maxWidth: 500,
      maxHeight: 500,
      selectionLimit: 1,
    });
    if (res.assets.length === 1) setImage(res.assets[0].uri);
  };

  const updateImage = async () => {
    try {
      await updateDoc(doc(db, "Organizations", id), { image })
      Toast.show({
        type: "success",
        text1: "Information updated!"
      })
    } catch (error) {
      console.error(error)
      Toast.show({
        type: "error",
        text1: "Update failed!",
      })
    }
  }

  const archiveOrganization = async () => {
    try {
      await updateDoc(doc(db, "Organizations", id), {
        archived: true
      })
      Toast.show({
        type: "success",
        text1: "Archived organization!"
      })
    } catch (error) {
      console.error(error)
      Toast.show({
        type: "error",
        text1: "Something unexpected happened!"
      })
    }
  }

  const deleteOrganization = async () => {
    try {
      await deleteDoc(doc(db, "Organizations", id))
      navigator.navigate("organizations")
      Toast.show({
        type: "success",
        text1: "Deleted organization!"
      })
    } catch (error) {
      console.error(error)
      Toast.show({
        type: "error",
        text1: "Something unexpected happened!"
      })
    }
  }

  const showArchiveConfirmation = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure to archive this organization?")) archiveOrganization();
    } else {
      Alert.alert(
        "Confirm",
        "Are you sure to archive this organization?",
        [
          { text: "No", style: "cancel" },
          { text: "Archive organization", style: "destructive", onPress: archiveOrganization }
        ]
      );
    }
  }

  const showDeleteConfirmation = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure to delete this organization? This action cannot be undone")) deleteOrganization();
    } else {
      Alert.alert(
        "Confirm",
        "Are you sure to delete this organization? This action cannot be undone!",
        [
          { text: "No", style: "cancel" },
          { text: "Delete organization", style: "destructive", onPress: deleteOrganization }
        ]
      );
    }
  }

  return (
    <View style={styles.content}>
      <ScrollView>
        <Text style={styles.primaryHeading}>Organization settings</Text>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName} />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.textarea}
          placeholder="Type here"
          multiline={true}
          value={description}
          onChangeText={setDescription}
        />
        <TouchableOpacity style={styles.button} onPress={updateInformation}>
          <Text style={styles.buttonText}>Update information</Text>
        </TouchableOpacity>
        <View style={styles.imageUploadView}>
          <Image source={typeof image === "string" ? { uri: image } : image} style={styles.imagePreview} />
          <View style={{ flexGrow: 1 }}>
            <Text style={styles.label}>Organization Image</Text>
            <TouchableOpacity style={styles.button} onPress={uploadImage}>
              <Text style={styles.buttonText}>Upload</Text>
            </TouchableOpacity>
            <View style={styles.separator} />
            <Text style={styles.infoText}>Recommended size: 500×500px</Text>
            <Text style={styles.infoText}>File types: JPG, JPEG, PNG</Text>
            <Text style={styles.infoText}>Max file size: 2MB</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.button} onPress={updateImage}>
          <Text style={styles.buttonText}>Update image</Text>
        </TouchableOpacity>
        <View style={{
          marginTop: 10,
          borderTopColor: "#777777",
          borderTopWidth: 0.5
        }}>
          <Text style={styles.primaryHeading}>Danger zone</Text>
          <View style={styles.actionRow}>
            <Text>Archive organization</Text>
            <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={showArchiveConfirmation}>
              <Text style={styles.buttonText}>Archive organization</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.actionRow}>
            <Text>Delete organization</Text>
            <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={showDeleteConfirmation}>
              <Text style={styles.buttonText}>Delete organization</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  organizationImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  organizationHeader: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },
  infoText: {
    fontWeight: 'light',
    color: '#555',
  },
  heading: {
    flexDirection: 'row',
    alignContent: 'space-between',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#389c9a',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    margin: 2,
    shadowColor: '#389c9a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 12,
  },
  textarea: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 10,
    marginBottom: 4,
    color: '#444',
  },
  separator: {
    height: 1,
    marginVertical: 3,
  },
  imagePreview: {
    width: 130,
    height: 130,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  imageUploadView: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    gap: 15,
    marginBottom: 30,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  dangerButton: {
    backgroundColor: '#DC143C',
  },
});
