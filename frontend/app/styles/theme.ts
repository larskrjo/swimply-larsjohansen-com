import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
    cssVariables: true, // v6+; works in v7
    colorSchemes: {
        light: {
            palette: {
                primary: { main: '#1976d2' },
                secondary: { main: '#9c27b0' },
            },
        },
        // dark: {
        //     palette: {
        //         primary: { main: '#90caf9' },
        //         secondary: { main: '#ce93d8' },
        //         background: { default: '#0b0f19', paper: '#121826' },
        //     },
        // },
    },
});