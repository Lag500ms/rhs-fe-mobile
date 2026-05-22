declare module 'react-native-vector-icons/Feather' {
  import { Component } from 'react';
  import { TextProperties } from 'react-native';

  interface IconProps extends TextProperties {
    name: string;
    size?: number;
    color?: string;
    style?: any;
  }

  export default class Icon extends Component<IconProps> {}
}