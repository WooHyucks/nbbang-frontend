import styled from 'styled-components';

const NavContainer = styled.div``;

const Logo = styled.a`
    display: inline-block;
    width: 60px;
    margin: 20px;
    img {
        display: block;
        width: 100%;
        border-radius: 20px;
    }
`;
const Nav = () => {
    return (
        <NavContainer>
            <Logo>
                <img
                    alt="Nbbang"
                    src="/images/nbbang.png"
                    onClick={() => (window.location.href = '/')}
                />
            </Logo>
        </NavContainer>
    );
};

export default Nav;
