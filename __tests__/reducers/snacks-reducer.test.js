import snacksReducer from "./../../src/reducers/snacks-reducer";
import constants from "./../../src/constants";
const { c, initialState } = constants;

describe("snacksReducer", () => {
  let action;

  test("Should return default state if no action type is recognized", () => {
    expect(snacksReducer(initialState.snacks, { type: null })).toEqual("");
  });

  test("Should update snacks when snacks are changed", () => {
    action = {
      type: c.RECEIVE_SNACKS,
      snacks: "Tomatoes"
    };

    expect(snacksReducer(initialState.snacks, action)).toEqual("Tomatoes");
  });
});