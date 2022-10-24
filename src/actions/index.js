import constants from "./../constants";
const { firebaseConfig, c } = constants;
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";

firebase.initializeApp(firebaseConfig);
// firebase.analytics();

const db = firebase.firestore();

//--------------------//
// INITIATION ACTIONS //
//--------------------//

export function toggleAuth(newAuthStatus) {
  return {
    type: c.TOGGLE_AUTH,
    newAuthStatus: newAuthStatus
  };
}

export function startFirebaseComm(userId, userName) {
  return function (dispatch) {
    db.collection("users").doc(userId).get().then((user) => {
      // If existing user, set up Firestore listener
      if (user.exists) {
        dispatch(setFirestoreListener(userId));

        // If first-time login, set up default data in Firestore and then set up listener
      } else {
        const categoriesRef = db.collection("users").doc(userId).collection("categories");
        const defaultCategories = ["Produce", "Proteins", "Other Foods", "Non-Foods"];
        const addDefaultCategories = () => {
          defaultCategories.forEach(category => {
            categoriesRef.add({
              name: category,
              // Timestamp is used to preserve the order of the categories for display purposes
              timestamp: Date.now() + defaultCategories.indexOf(category) * 1000
            });
          });
        };

        const menuRef = db.collection("users").doc(userId).collection("menu");
        const defaultDayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const addDefaultDayNames = () => {
          defaultDayNames.forEach(dayName => {
            menuRef.doc(defaultDayNames.indexOf(dayName).toString()).set({
              dayName: dayName,
              meals: {
                breakfast: "______________________________",
                lunch: "______________________________",
                dinner: "______________________________"
              }
            });
          });
        };
        // Don't think I need to do this 
        // const settingsRef = db.collection("users").doc(userId).collection("settings");
        // const addSettings = () => {
        //   settingsRef.add({

        //   });
        // };

        db.collection("users").doc(userId).set({
          name: userName,
          snacks: "_________________________"
        })
          .then(addDefaultDayNames())
          .then(addDefaultCategories())
          .then(dispatch(setFirestoreListener(userId)));
      }
    });
  };
}

function setFirestoreListener(userId) {
  return function (dispatch) {

    // Listen for menu updates
    const menuRef = db.collection("users").doc(userId).collection("menu");
    menuRef.onSnapshot(menuSnapshot => {
      menuSnapshot.forEach(daySnapshot => {
        let dayId = daySnapshot.id;
        let dayName = daySnapshot.data().dayName;
        let mealsForDay = daySnapshot.data().meals;
        dispatch(receiveMeals(dayId, dayName, mealsForDay));
      });
    });

    // Listen for snacks and user settings
    db.collection("users").doc(userId).onSnapshot(userSnapshot => {
      let snacks = userSnapshot.data().snacks;
      const autoAdd = userSnapshot.data().autoAdd;
      dispatch(receiveSnacks(snacks));
      dispatch(receiveAutoAdd(autoAdd));
    });

    // Listen for shopping list updates
    const categoriesRef = db.collection("users").doc(userId).collection("categories");
    categoriesRef.orderBy("timestamp")
      .onSnapshot(categoryCollectionSnapshot => {
        categoryCollectionSnapshot.forEach(categorySnapshot => {
          let categoryId = categorySnapshot.id;
          let category = categorySnapshot.data();
          categoriesRef.doc(categoryId).collection("items").orderBy("timestamp", "desc")
            .onSnapshot(itemsCollectionSnapshot => {
              let items = {};
              itemsCollectionSnapshot.forEach(itemSnapshot => {
                items[itemSnapshot.id] = itemSnapshot.data();
              });
              dispatch(receiveCategory(categoryId, category, items));
            }
            );
        });
      });
  };
}

function receiveMeals(dayId, dayName, mealsFromFirebase) {
  return {
    type: c.RECEIVE_MEALS,
    dayId: dayId,
    dayName: dayName,
    meals: mealsFromFirebase
  };
}

function receiveSnacks(snacksFromFirebase) {
  return {
    type: c.RECEIVE_SNACKS,
    snacks: snacksFromFirebase
  };
}

function receiveAutoAdd(autoAddFromFirebase) {
  return {
    type: c.RECEIVE_AUTO_ADD,
    autoAdd: autoAddFromFirebase
  };
}

function receiveCategory(categoryIdFromFirebase, categoryFromFirebase, itemsFromFirebase) {
  return {
    type: c.RECEIVE_CATEGORY,
    categoryId: categoryIdFromFirebase,
    category: categoryFromFirebase,
    items: itemsFromFirebase
  };
}

//-----------------------//
// SHOPPING LIST ACTIONS //
//-----------------------//

export function addGroceryItem(_name, _categoryId) {
  return function () {
    const userId = firebase.auth().currentUser.uid;
    const categoriesRef = db.collection("users").doc(userId).collection("categories");
    categoriesRef.doc(_categoryId).collection("items").add({
      name: _name,
      checked: false,
      timestamp: Date.now()
    });
  };
}

export function toggleChecked(categoryId, itemId) {
  return function () {
    const userId = firebase.auth().currentUser.uid;
    var itemRef = db.collection("users").doc(userId).collection("categories").doc(categoryId).collection("items").doc(itemId);
    itemRef.get().then(item => {
      if (item.data().checked == true) {
        itemRef.update({
          "checked": false
        });
      } else {
        itemRef.update({
          "checked": true
        });
      }
    });
  };
}

export function clearShoppingList() {
  return function () {
    const userId = firebase.auth().currentUser.uid;
    const categoriesRef = db.collection("users").doc(userId).collection("categories");
    categoriesRef.get()
      .then(querySnapshot => {
        querySnapshot.forEach(doc => {
          let categoryId = doc.id;
          categoriesRef.doc(categoryId).collection("items").get()
            .then(querySnapshot => {
              querySnapshot.forEach(item => {
                categoriesRef.doc(categoryId).collection("items").doc(item.id).delete();
              });
            });
        });
      });
  };
}

// This is identical to clearShoppingList() except for the .where statement! Refactor
export function clearCheckedItems() {
  return function () {
    const userId = firebase.auth().currentUser.uid;
    const categoriesRef = db.collection("users").doc(userId).collection("categories");
    categoriesRef.get()
      .then(querySnapshot => {
        querySnapshot.forEach(doc => {
          let categoryId = doc.id;
          categoriesRef.doc(categoryId).collection("items").where("checked", "==", true).get()
            .then(querySnapshot => {
              querySnapshot.forEach(item => {
                categoriesRef.doc(categoryId).collection("items").doc(item.id).delete();
              });
            });
        });
      });
  };
}

//---------------------------------------//
// MEAL PLANNING (MENU + SNACKS) ACTIONS //
//---------------------------------------//

export function updateMenu(mealKeyValue, dayId) {
  return function () {
    const userId = firebase.auth().currentUser.uid;
    const dayRef = db.collection("users").doc(userId).collection("menu").doc(dayId);
    dayRef.update(mealKeyValue);
  };
}

export function updateSnacks(snacksKeyValue) {
  return function () {
    const userId = firebase.auth().currentUser.uid;
    db.collection("users").doc(userId).update(snacksKeyValue);
  };
}

export function clearMenu() {
  return function () {
    const userId = firebase.auth().currentUser.uid;
    const menuRef = db.collection("users").doc(userId).collection("menu");

    menuRef.get()
      .then(querySnapshot => {
        querySnapshot.forEach(doc => {
          let dayId = doc.id;
          menuRef.doc(dayId).update({
            "meals.breakfast": "______________________________",
            "meals.lunch": "______________________________",
            "meals.dinner": "______________________________"
          });
        });
      });

    db.collection("users").doc(userId).update({
      "snacks": "_________________________"
    });
  };
}

//---------------------- //
// USER SETTINGS ACTIONS //
//---------------------- //

// autoAddCategories is a json with category IDs as keys
export function updateAutoAdd(autoAddCategories) {
  return function () {
    const userId = firebase.auth().currentUser.uid;
    const userRef = db.collection("users").doc(userId);
    userRef.update({ 
      autoAdd: autoAddCategories
    });
  };
}