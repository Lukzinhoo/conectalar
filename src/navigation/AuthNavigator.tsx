import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// ======================================================
// MOBILE - AUTENTICAÇÃO
// ======================================================

import WelcomeScreen from '../screens/auth/WelcomeScreen';
import MoradorLoginScreen from '../screens/auth/MoradorLoginScreen';
import AdminLoginScreen from '../screens/auth/AdminLoginScreen';

// ======================================================
// MOBILE - ADMIN
// ======================================================

import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import MoradoresAdminScreen from '../screens/admin/MoradoresAdminScreen';
import NovoMoradorScreen from '../screens/admin/NovoMoradorScreen';
import ReservasAdminScreen from '../screens/admin/ReservasAdminScreen';
import CasasAdminScreen from '../screens/admin/CasasAdminScreen';
import ComunicadosAdminScreen from '../screens/admin/ComunicadosAdminScreen';
import OcorrenciasAdminScreen from '../screens/admin/OcorrenciasAdminScreen';
import AdministracaoAdminScreen from '../screens/admin/AdministracaoAdminScreen';

import ChatAdminScreen from '../screens/admin/ChatAdminScreen';
import ChatGeralAdminScreen from '../screens/admin/ChatGeralAdminScreen';
import RegrasAdminScreen from '../screens/admin/RegrasAdminScreen';

// ======================================================
// MOBILE - MORADOR
// ======================================================

import MoradorHomeScreen from '../screens/morador/MoradorHomeScreen';

// ======================================================
// WEB - ADMIN
// ======================================================

import WebLoginScreen from '../screens/web/adm/WebLoginScreen';
import WebDashboardScreen from '../screens/web/adm/WebDashboardScreen';

import WebMoradoresScreen from '../screens/web/adm/WebMoradoresScreen';
import WebNovoMoradorScreen from '../screens/web/adm/WebNovoMoradorScreen';

import WebReservasScreen from '../screens/web/adm/WebReservasScreen';
import WebComunicadosScreen from '../screens/web/adm/WebComunicadosScreen';
import WebOcorrenciasScreen from '../screens/web/adm/WebOcorrenciasScreen';

import WebChatScreen from '../screens/web/adm/WebChatScreen';
import WebChatGeralScreen from '../screens/web/adm/WebChatGeralScreen';
import WebRegrasScreen from '../screens/web/adm/WebRegrasScreen';
import WebHorariosScreen from '../screens/web/adm/WebHorariosScreen';
import WebNotificacoesScreen from '../screens/web/adm/WebNotificacoesScreen';

import WebFinanceiroScreen from '../screens/web/adm/WebFinanceiroScreen';

// ======================================================
// WEB - MORADOR
// ======================================================

import WebMoradorHomeScreen from '../screens/web/morador/WebMoradorHomeScreen';
import WebMoradorReservasScreen from '../screens/web/morador/WebMoradorReservasScreen';
import WebMoradorComunicadosScreen from '../screens/web/morador/WebMoradorComunicadosScreen';
import WebMoradorOcorrenciasScreen from '../screens/web/morador/WebMoradorOcorrenciasScreen';
import WebMoradorChatScreen from '../screens/web/morador/WebMoradorChatScreen';
import WebMoradorChatGeralScreen from '../screens/web/morador/WebMoradorChatGeralScreen';
import WebMoradorRegrasScreen from '../screens/web/morador/WebMoradorRegrasScreen';
import WebMoradorHorariosScreen from '../screens/web/morador/WebMoradorHorariosScreen';
import WebMoradorNotificacoesScreen from '../screens/web/morador/WebMoradorNotificacoesScreen';
import WebMoradorPerfilScreen from '../screens/web/morador/WebMoradorPerfilScreen';

// ======================================================
// ROTAS
// ======================================================

export type AuthStackParamList = {
  // ----------------------------------------------------
  // MOBILE
  // ----------------------------------------------------

  Welcome: undefined;

  MoradorLogin: undefined;
  MoradorHome: undefined;

  AdminLogin: undefined;
  AdminHome: undefined;

  MoradoresAdmin: undefined;
  NovoMorador: undefined;

  ReservasAdmin: undefined;

  CasasAdmin: undefined;

  ComunicadosAdmin: undefined;

  OcorrenciasAdmin: undefined;

  AdministracaoAdmin: undefined;

  ChatAdmin: undefined;

  ChatGeralAdmin: undefined;

  RegrasAdmin: undefined;

  // ----------------------------------------------------
  // WEB - ADMIN
  // ----------------------------------------------------

  WebLogin: undefined;

  WebDashboard: undefined;

  WebMoradores: undefined;

  WebNovoMorador: undefined;

  WebReservas: undefined;

  WebComunicados: undefined;

  WebOcorrencias: undefined;

  WebChat: undefined;

  WebChatGeral: undefined;

  WebRegras: undefined;

  WebHorarios: undefined;

  WebNotificacoes: undefined;

  WebFinanceiro: undefined;

  // ----------------------------------------------------
  // WEB - MORADOR
  // ----------------------------------------------------

  WebMoradorHome: undefined;

  WebMoradorReservas: undefined;

  WebMoradorComunicados: undefined;

  WebMoradorOcorrencias: undefined;

  WebMoradorChat: undefined;

  WebMoradorChatGeral: undefined;

  WebMoradorRegras: undefined;

  WebMoradorHorarios: undefined;

  WebMoradorNotificacoes: undefined;

  WebMoradorPerfil: undefined;
};

// ======================================================
// STACK
// ======================================================

const Stack =
  createNativeStackNavigator<AuthStackParamList>();

// ======================================================
// NAVIGATOR
// ======================================================

export default function AuthNavigator() {
  const isWeb = Platform.OS === 'web';

  return (
    <Stack.Navigator
      initialRouteName={
        isWeb
          ? 'WebLogin'
          : 'Welcome'
      }
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* =================================================
          MOBILE
      ================================================= */}

      {!isWeb && (
        <>
          {/* AUTENTICAÇÃO */}

          <Stack.Screen
            name="Welcome"
            component={WelcomeScreen}
          />

          <Stack.Screen
            name="MoradorLogin"
            component={MoradorLoginScreen}
          />

          <Stack.Screen
            name="AdminLogin"
            component={AdminLoginScreen}
          />

          {/* MORADOR */}

          <Stack.Screen
            name="MoradorHome"
            component={MoradorHomeScreen}
          />

          {/* ADMIN */}

          <Stack.Screen
            name="AdminHome"
            component={AdminHomeScreen}
          />

          <Stack.Screen
            name="MoradoresAdmin"
            component={MoradoresAdminScreen}
          />

          <Stack.Screen
            name="NovoMorador"
            component={NovoMoradorScreen}
          />

          <Stack.Screen
            name="ReservasAdmin"
            component={ReservasAdminScreen}
          />

          <Stack.Screen
            name="CasasAdmin"
            component={CasasAdminScreen}
          />

          <Stack.Screen
            name="ComunicadosAdmin"
            component={ComunicadosAdminScreen}
          />

          <Stack.Screen
            name="OcorrenciasAdmin"
            component={OcorrenciasAdminScreen}
          />

          <Stack.Screen
            name="AdministracaoAdmin"
            component={AdministracaoAdminScreen}
          />

          <Stack.Screen
            name="ChatAdmin"
            component={ChatAdminScreen}
          />

          <Stack.Screen
            name="ChatGeralAdmin"
            component={ChatGeralAdminScreen}
          />

          <Stack.Screen
            name="RegrasAdmin"
            component={RegrasAdminScreen}
          />
        </>
      )}

      {/* =================================================
          WEB
      ================================================= */}

      {isWeb && (
        <>
          {/* LOGIN */}

          <Stack.Screen
            name="WebLogin"
            component={WebLoginScreen}
          />

          {/* ===============================================
              WEB ADMIN
          =============================================== */}

          <Stack.Screen
            name="WebDashboard"
            component={WebDashboardScreen}
          />

          <Stack.Screen
            name="WebMoradores"
            component={WebMoradoresScreen}
          />

          <Stack.Screen
            name="WebNovoMorador"
            component={WebNovoMoradorScreen}
          />

          <Stack.Screen
            name="WebReservas"
            component={WebReservasScreen}
          />

          <Stack.Screen
            name="WebComunicados"
            component={WebComunicadosScreen}
          />

          <Stack.Screen
            name="WebOcorrencias"
            component={WebOcorrenciasScreen}
          />

          <Stack.Screen
            name="WebChat"
            component={WebChatScreen}
          />

          <Stack.Screen
            name="WebChatGeral"
            component={WebChatGeralScreen}
          />

          <Stack.Screen
            name="WebRegras"
            component={WebRegrasScreen}
          />

          <Stack.Screen
            name="WebHorarios"
            component={WebHorariosScreen}
          />

          <Stack.Screen
            name="WebNotificacoes"
            component={WebNotificacoesScreen}
          />

          <Stack.Screen
            name="WebFinanceiro"
            component={WebFinanceiroScreen}
          />

          {/* ===============================================
              WEB MORADOR
          =============================================== */}

          <Stack.Screen
            name="WebMoradorHome"
            component={WebMoradorHomeScreen}
          />

          <Stack.Screen
            name="WebMoradorReservas"
            component={WebMoradorReservasScreen}
          />

          <Stack.Screen
            name="WebMoradorComunicados"
            component={WebMoradorComunicadosScreen}
          />

          <Stack.Screen
            name="WebMoradorOcorrencias"
            component={WebMoradorOcorrenciasScreen}
          />

          <Stack.Screen
            name="WebMoradorChat"
            component={WebMoradorChatScreen}
          />

          <Stack.Screen
            name="WebMoradorChatGeral"
            component={WebMoradorChatGeralScreen}
          />

          <Stack.Screen
            name="WebMoradorRegras"
            component={WebMoradorRegrasScreen}
          />

          <Stack.Screen
            name="WebMoradorHorarios"
            component={WebMoradorHorariosScreen}
          />

          <Stack.Screen
            name="WebMoradorNotificacoes"
            component={WebMoradorNotificacoesScreen}
          />

          <Stack.Screen
            name="WebMoradorPerfil"
            component={WebMoradorPerfilScreen}
          />
        </>
      )}
    </Stack.Navigator>
  );
}