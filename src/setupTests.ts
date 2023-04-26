// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import excludeAllWarning from './test';
import { configure } from 'enzyme';
import Adapter from '@cfaester/enzyme-adapter-react-18';

configure({ adapter: new Adapter() });

jest.mock('firebase/app', () => ({ 
  initializeApp: jest.fn()
}));
jest.mock('firebase/analytics', () => ({ 
  getAnalytics: jest.fn().mockReturnValue({
    app:{
      name: '[DEFAULT]'
    }
  }),
  logEvent: jest.fn()
}));

excludeAllWarning()