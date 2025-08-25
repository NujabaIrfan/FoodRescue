import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import { launchImageLibrary } from 'react-native-image-picker';

export default function CreateOrganization() {
  const [image, setImage] = useState(require('../../assets/default-image.jpg'));

  const uploadImage = async () => {
    let res = await launchImageLibrary({
      mediaType: 'photo',
      maxWidth: 500,
      maxHeight: 500,
      selectionLimit: 1,
    });
    if (res.assets.length === 1) setImage(res.assets[0].uri);
  };

  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.primaryHeading}>Set up your organization</Text>

      <Text style={styles.label}>Organization name</Text>
      <TextInput style={styles.input} placeholder="Name" />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.textarea}
        placeholder="Type here"
        multiline={true}
      />

      <View style={styles.imageUploadView}>
        <Image source={image} style={styles.imagePreview} />
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
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Create organization</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  primaryHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 10,
    marginBottom: 4,
    color: '#444',
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
  imageUploadView: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    gap: 15,
    marginBottom: 30,
  },
  imagePreview: {
    width: 130,
    height: 130,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
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
    alignSelf: 'stretch',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  infoText: {
    fontWeight: 'light',
    color: '#555',
    fontSize: 12,
  },
  separator: {
    height: 1,
    marginVertical: 3,
  },
});
