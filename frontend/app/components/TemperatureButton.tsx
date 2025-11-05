import ThermostatIcon from '@mui/icons-material/Thermostat';
import Fab from '@mui/material/Fab';

export default function TemperatureButton(props: { value: string, onClick: () => void }) {

    return (
        <Fab variant="extended" onClick={props.onClick} sx={{left: "50%"}}>
            <ThermostatIcon />
            {props.value == 'Celsius' ? '°C' : '°F'}
        </Fab>
    );
}
