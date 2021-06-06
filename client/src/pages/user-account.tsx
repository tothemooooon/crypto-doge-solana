import Layout from "../components/layout";
import UserDoges from "../components/user-doges";

const UserAccount = () => {
  return (
    <Layout>
      <p className="mt-10 text-3xl text-center">Owned CryptoDoges</p>
      <UserDoges />
    </Layout>
  );
};

export default UserAccount;
