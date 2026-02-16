import React from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

export default function BankingWavyDivider() {
  return (
    <View style={{ height: 40, marginBottom: -1, backgroundColor: "#F0FFFE" }}>
      <Svg width="100%" height="40" viewBox="0 0 390 40" preserveAspectRatio="none">
        <Path d="M0,20 Q98,0 196,20 T392,20 L392,40 L0,40 Z" fill="#6B3AA0" />
      </Svg>
    </View>
  );
}
