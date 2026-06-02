// We halen useEffect en useState uit React.
// useState = iets onthouden in de app.
// useEffect = iets automatisch doen als de app start.
import { useEffect, useState } from 'react';

// Hier halen we onderdelen uit React Native.
// Deze onderdelen gebruiken we om het scherm te bouwen.
import {
  SafeAreaView,      // Zorgt dat de app niet onder de notch valt
  View,              // Een soort container/blok
  Text,              // Hiermee toon je tekst
  TextInput,         // Hiermee kan de gebruiker tekst invoeren
  FlatList,          // Hiermee toon je een lijst
  TouchableOpacity,  // Een klikbare knop
  StyleSheet,        // Hiermee maken we styling
  Alert,             // Hiermee tonen we een melding
  Modal,             // Hiermee openen we een extra scherm
  Image,             // Hiermee tonen we een foto
} from 'react-native';

// MapView is de kaart.
// Marker is een pin op de kaart.
import MapView, { Marker } from 'react-native-maps';

// Dit is de URL van onze ASP.NET Core API.
// Via deze URL halen we personen op en slaan we personen op.
const API_URL = 'https://to.internus.info/api/apimappersons';

export default function App() {
  // Hier bewaren we alle personen uit de database.
  const [persons, setPersons] = useState([]);

  // Hiermee bepalen we of het formulier zichtbaar is.
  const [formVisible, setFormVisible] = useState(false);

  // Hiermee bepalen we of de kaart zichtbaar is.
  const [mapVisible, setMapVisible] = useState(false);

  // Dit zijn de velden van het formulier.
  // Elke TextInput krijgt zijn eigen state.
  const [mapPersonId, setMapPersonId] = useState(null);
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Deze useEffect draait automatisch als de app opent.
  useEffect(() => {
    loadPersons();
  }, []);

  // READ
  // Deze functie haalt alle personen op uit de API.
  const loadPersons = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      // We stoppen de opgehaalde data in persons.
      setPersons(data);
    } catch (error) {
      Alert.alert('Fout', 'Personen konden niet worden geladen.');
    }
  };

  // Deze functie maakt het formulier leeg.
  const resetForm = () => {
    setMapPersonId(null);
    setName('');
    setLatitude('');
    setLongitude('');
    setPhotoUrl('');
  };

  // Deze functie opent het formulier om een nieuw persoon toe te voegen.
  const openCreate = () => {
    resetForm();
    setFormVisible(true);
  };

  // Deze functie opent het formulier met bestaande gegevens.
  // Dit gebruiken we om iemand te wijzigen.
  const openEdit = (person) => {
    setMapPersonId(person.mapPersonId);
    setName(person.name);
    setLatitude(person.latitude);
    setLongitude(person.longitude);
    setPhotoUrl(person.photoUrl ?? '');

    setFormVisible(true);
  };

  // CREATE of UPDATE
  // Deze functie slaat een persoon op.
  const savePerson = async () => {
    // Eerst controleren we of verplichte velden zijn ingevuld.
    if (!name || !latitude || !longitude) {
      Alert.alert('Let op', 'Vul naam, latitude en longitude in.');
      return;
    }

    // We maken een object van de ingevulde gegevens.
    const person = {
      name: name,
      latitude: latitude,
      longitude: longitude,
      photoUrl: photoUrl,
    };

    // Als mapPersonId bestaat, dan wijzigen we een bestaande persoon.
    if (mapPersonId) {
      person.mapPersonId = mapPersonId;
    }

    try {
      // Als er een id is, gebruiken we PUT.
      // Zonder id gebruiken we POST.
      const response = await fetch(
        mapPersonId ? `${API_URL}/${mapPersonId}` : API_URL,
        {
          method: mapPersonId ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(person),
        }
      );

      if (!response.ok) {
        throw new Error('Opslaan mislukt');
      }

      // Formulier sluiten.
      setFormVisible(false);

      // Formulier leegmaken.
      resetForm();

      // Lijst opnieuw laden.
      loadPersons();
    } catch (error) {
      Alert.alert('Fout', 'Opslaan is mislukt.');
    }
  };

  // DELETE
  // Deze functie verwijdert een persoon.
  const deletePerson = () => {
    Alert.alert(
      'Verwijderen',
      'Weet je zeker dat je deze persoon wilt verwijderen?',
      [
        {
          text: 'Annuleren',
          style: 'cancel',
        },
        {
          text: 'Verwijderen',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/${mapPersonId}`, {
                method: 'DELETE',
              });

              if (!response.ok) {
                throw new Error('Verwijderen mislukt');
              }

              setFormVisible(false);
              resetForm();
              loadPersons();
            } catch (error) {
              Alert.alert('Fout', 'Verwijderen is mislukt.');
            }
          },
        },
      ]
    );
  };

  // Alleen personen met geldige latitude en longitude komen op de kaart.
  const validPersons = persons.filter(
    (person) =>
      person.latitude &&
      person.longitude &&
      !isNaN(parseFloat(person.latitude)) &&
      !isNaN(parseFloat(person.longitude))
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header bovenaan */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMapVisible(true)}>
          <Text style={styles.headerButton}>🗺️</Text>
        </TouchableOpacity>

        <Text style={styles.title}>People Map</Text>

        <TouchableOpacity onPress={openCreate}>
          <Text style={styles.headerButton}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* Lijst met personen */}
      <FlatList
        data={persons}
        keyExtractor={(item) => item.mapPersonId.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openEdit(item)}>
            {item.photoUrl ? (
              <Image source={{ uri: item.photoUrl }} style={styles.photo} />
            ) : (
              <View style={styles.placeholder}>
                <Text>👤</Text>
              </View>
            )}

            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text>Latitude: {item.latitude}</Text>
              <Text>Longitude: {item.longitude}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Kaart scherm */}
      <Modal visible={mapVisible} animationType="slide">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setMapVisible(false)}>
              <Text style={styles.closeButton}>Sluiten</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Kaart</Text>

            <View style={{ width: 60 }} />
          </View>

          <MapView
            style={styles.map}
            initialRegion={{
              latitude: 52.3676,
              longitude: 4.9041,
              latitudeDelta: 20,
              longitudeDelta: 20,
            }}
          >
            {validPersons.map((person) => (
              <Marker
                key={person.mapPersonId}
                coordinate={{
                  latitude: parseFloat(person.latitude),
                  longitude: parseFloat(person.longitude),
                }}
                title={person.name}
                description={`${person.latitude}, ${person.longitude}`}
              />
            ))}
          </MapView>
        </SafeAreaView>
      </Modal>

      {/* Formulier scherm */}
      <Modal visible={formVisible} animationType="slide">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setFormVisible(false)}>
              <Text style={styles.closeButton}>Annuleer</Text>
            </TouchableOpacity>

            <Text style={styles.title}>
              {mapPersonId ? 'Wijzigen' : 'Toevoegen'}
            </Text>

            <TouchableOpacity onPress={savePerson}>
              <Text style={styles.saveButton}>Opslaan</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Naam"
              value={name}
              onChangeText={setName}
            />

            <TextInput
              style={styles.input}
              placeholder="Latitude"
              value={latitude}
              onChangeText={setLatitude}
            />

            <TextInput
              style={styles.input}
              placeholder="Longitude"
              value={longitude}
              onChangeText={setLongitude}
            />

            <TextInput
              style={styles.input}
              placeholder="Foto URL"
              value={photoUrl}
              onChangeText={setPhotoUrl}
            />

            {mapPersonId && (
              <TouchableOpacity style={styles.deleteButton} onPress={deletePerson}>
                <Text style={styles.deleteText}>Verwijder persoon</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// Hier staat alle styling van de app.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },

  header: {
    height: 55,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
  },

  headerButton: {
    fontSize: 28,
    color: '#007aff',
  },

  closeButton: {
    color: '#007aff',
    fontSize: 16,
  },

  saveButton: {
    color: '#007aff',
    fontSize: 16,
    fontWeight: '600',
  },

  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },

  photo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },

  placeholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  name: {
    fontSize: 17,
    fontWeight: '600',
  },

  form: {
    padding: 15,
  },

  input: {
    backgroundColor: '#fff',
    height: 45,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 8,
  },

  deleteButton: {
    backgroundColor: '#fff',
    marginTop: 25,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },

  deleteText: {
    color: '#dc2626',
    fontWeight: '700',
  },

  map: {
    flex: 1,
  },
});