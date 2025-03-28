const Square = ({...props}) => (
<svg width="200px" height="200px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect stroke={props.stroke ?? 'white'} x="4" y="4" width="16" height="16" rx="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
</svg>
);

export default Square; 