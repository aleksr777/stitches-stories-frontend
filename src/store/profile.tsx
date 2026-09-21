import { Link } from 'react-router-dom';
import { NewsletterDialog } from './newsletter';
import ProfileAccountDialog from './profile-account-dialog';
import ProfileCustomer from './profile-customer';
import ProfileMenu from './profile-menu';
import { useProfileData } from './use-profile-data';

const Profile = () => {
  const profile = useProfileData();
  const { user, error, dialog, setDialog, currentPassword, setCurrentPassword } = profile;

  return (
    <section className="page">
      <p className="eyebrow">Ваш маленький уголок</p>
      <h1>{user ? 'Здравствуйте, ' + (user.name ?? user.nickname ?? 'друг') : 'Личный кабинет'}</h1>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {user && (
        <div className="profile-grid">
          <ProfileMenu user={user} logout={profile.logout} />
          <div>
            {user.role === 'admin' ? (
              <section className="panel">
                <h2>Управление магазином</h2>
                <p>
                  Вы владелец Stitches &amp; Stories. Для этого профиля не нужны согласия
                  покупателя, избранное и заявки на покупку.
                </p>
                <Link className="button secondary" to="/admin/shop">
                  Перейти к изделиям
                </Link>
              </section>
            ) : (
              <ProfileCustomer
                orders={profile.orders}
                marketing={profile.marketing}
                events={profile.events}
                busy={profile.busy}
                withdraw={(purpose) => profile.withdraw(purpose)}
                openDialog={setDialog}
              />
            )}
          </div>
        </div>
      )}
      {dialog === 'newsletter' && (
        <NewsletterDialog
          close={() => {
            setDialog('');
            profile.refresh();
          }}
        />
      )}
      {dialog === 'account' && (
        <ProfileAccountDialog
          busy={profile.busy}
          error={error}
          password={currentPassword}
          setPassword={setCurrentPassword}
          close={() => {
            setCurrentPassword('');
            setDialog('');
          }}
          withdraw={(password) => void profile.withdraw('account', password)}
        />
      )}
    </section>
  );
};

export default Profile;
