import './RestrictedActions.css';
import ChangeChips from './restricted_components/ChangeChips';
import ChangePassword from './restricted_components/ChangePassword';
import ForceLogout from './restricted_components/ForceLogout';

function RestrictedActions() {

  return (
    <div>
      <ChangeChips />
      <ChangePassword />
      <ForceLogout />
    </div>
  );
}

export default RestrictedActions;