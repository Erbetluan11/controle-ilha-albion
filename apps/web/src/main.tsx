import React from 'react';import {createRoot} from 'react-dom/client';import {QueryClient,QueryClientProvider} from '@tanstack/react-query';import App from './App';import './style.css';
const client=new QueryClient({defaultOptions:{queries:{retry:1,staleTime:120000,refetchOnWindowFocus:false}}});
class Boundary extends React.Component<{children:React.ReactNode},{error:boolean}>{state={error:false};static getDerivedStateFromError(){return {error:true}}render(){return this.state.error?<main><h1>Não foi possível renderizar a página.</h1><button onClick={()=>location.reload()}>Recarregar</button></main>:this.props.children}}
createRoot(document.getElementById('root')!).render(<Boundary><QueryClientProvider client={client}><App/></QueryClientProvider></Boundary>);
