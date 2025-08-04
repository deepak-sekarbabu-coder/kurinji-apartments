import { addDoc, collection } from 'firebase/firestore';

import { db } from '../src/lib/firebase';

const insertApartments = async () => {
  const apartmentsCol = collection(db, 'apartments');
  const apartmentIds = ['F1', 'F2', 'S1', 'S2', 'S3'];

  try {
    for (const id of apartmentIds) {
      await addDoc(apartmentsCol, {
        id, // Optional: You can also use the document ID as the apartment ID.
        name: `Apartment ${id}`, // Optional: Add a name or other fields.
      });
      console.log(`Added apartment ${id}`);
    }
    console.log('All apartments added successfully!');
  } catch (error) {
    console.error('Error adding apartments:', error);
  }
};

// Call the function to insert the data.
insertApartments();
