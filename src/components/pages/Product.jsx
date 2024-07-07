import { Box, Paper, Avatar, Typography, Button } from "@mui/material";
import bgImg from "../../img/bg.png";
import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";
import TimelineOppositeContent, {
  timelineOppositeContentClasses,
} from "@mui/lab/TimelineOppositeContent";
import dayjs from "dayjs";
import { useLocation, useNavigate } from "react-router-dom";
import abi from "../../utils/Identeefi.json";
import { useEffect, useState } from "react";
import { ethers } from "ethers";

const getEthereumObject = () => window.ethereum;

/*
 * This function returns the first linked account found.
 * If there is no account linked, it will return null.
 */
const findMetaMaskAccount = async () => {
  try {
    const ethereum = getEthereumObject();

    /*
     * First make sure we have access to the Ethereum object.
     */
    if (!ethereum) {
      console.error("Make sure you have Metamask!");
      return null;
    }

    console.log("We have the Ethereum object", ethereum);
    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      return account;
    } else {
      console.error("No authorized account found");
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

const Product = () => {
  const [currentAccount, setCurrentAccount] = useState("");

  const [serialNumber, setSerialNumber] = useState("");
  const [productData, setProductData] = useState("");

  const [name, setName] = useState("P");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [history, setHistory] = useState([]);
  const [isSold, setisSold] = useState(false);
  const [toUpdate, setToUpdate] = useState(false);
  const [image, setImage] = useState({
    file: [],
    filepreview: null,
  });

  const CONTRACT_ADDRESS = "0x62081f016446585cCC507528cc785980296b4Ccd";
  const CONTRACT_ABI = abi.abi;

  const navigate = useNavigate();
  const location = useLocation();
  // const qrData = location.state?.qrData
  const locationState = location.state;

  useEffect(() => {
    !!locationState?.serialNumber && getDataFromKuthunTari();
  }, [locationState]);

  const getDataFromKuthunTari = async () => {
    const { ethereum } = window;

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const productContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      const product = await productContract.getProduct(
        locationState?.serialNumber
      );

      console.log("Retrieved product...", product);
      // setData(product.toString())
      setSaglaData(product);
    } else {
      console.log("Ethereum object doesn't exist!");
    }
  };

  useEffect(() => {
    console.log("scannedData2: ", locationState);
    setName(locationState?.name);
    setBrand(locationState?.brand);
    setSerialNumber(locationState?.serialNumber);
  }, [locationState]);

  const getImage = async (imageName) => {
    setImage((prevState) => ({
      ...prevState,
      filepreview: `http://localhost:3003/file/product/${imageName}`,
    }));
  };

  const handleScan = async (qrData) => {
    const data = qrData.split(",");
    const contractAddress = data[0];
    setSerialNumber(data[1]);

    console.log("contract address", contractAddress);
    console.log("serial number", data[1]);

    if (contractAddress === CONTRACT_ADDRESS) {
      try {
        const { ethereum } = window;

        if (ethereum) {
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();
          const productContract = new ethers.Contract(
            CONTRACT_ADDRESS,
            CONTRACT_ABI,
            signer
          );

          console.log("here");

          const product = await productContract.getProduct(data[1].toString());

          // setProductData(product.toString())
          // setToUpdate(true);

          console.log("Retrieved product...", product);
          // setData(product.toString())

          setSaglaData(product);
        } else {
          console.log("Ethereum object doesn't exist!");
        }
      } catch (error) {
        console.log(error);
      }
    }
  };

  const setSaglaData = (data) => {
    let retrievedProduct = data;

    setName(retrievedProduct[1]);
    setBrand(retrievedProduct[2]);
    setDescription(retrievedProduct[3]);
    getImage(retrievedProduct[4]);

    let history = retrievedProduct[5]?.map((obj) => {
      setisSold(obj[4]);
      return {
        actor: obj[1],
        location: obj[2],
        timestamp: obj[3],
        isSold: obj[4],
      };
    });
    console.log("historyAali: ", history);
    setHistory(history);
  };

  const setData = (d) => {
    console.log("product data: ", d);

    const arr = d.split(",");
    console.log("arr", arr);

    setName(arr[1]);
    setBrand(arr[2]);
    // setDescription(arr[3].replace(/;/g, ','))
    setDescription(arr[3]);
    // setImage(arr[4]);
    getImage(arr[4]);

    const hist = [];
    let start = 5;

    for (let i = 5; i < arr.length; i += 5) {
      const actor = arr[start + 1];
      // const location = arr[start + 2].replace(/;/g, ',')
      const location = arr[start + 2];
      const timestamp = arr[start + 3];
      const isSold = arr[start + 4] === "true" ? setisSold(true) : false;

      hist.push({
        actor,
        location,
        timestamp,
        isSold,
      });

      start += 5;
    }
    console.log("hist", hist);
    setHistory(hist);
  };

  const handleBack = () => {
    // navigate(-2);
    navigate("/scanner");
  };

  const getHistory = () => {
    return history.map((item, index) => {
      const date = dayjs(item.timestamp * 1000).format("MM/DD/YYYY");
      const time = dayjs(item.timestamp * 1000).format("HH:mm a");
      console.log("getting history");

      return (
        <TimelineItem key={index}>
          <TimelineOppositeContent color="textSecondary">
            {time} {date}
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineDot />
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent sx={{ py: "12px", px: 2 }}>
            <Typography>Location: {item.location}</Typography>
            <Typography>Actor: {item.actor}</Typography>
          </TimelineContent>
        </TimelineItem>
      );
    });
  };

  return (
    <Box
      sx={{
        minHeight: "92vh",
        backgroundColor: "#e3eefc",
        display: "grid",
        placeItems: "center",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: "400px",
          // margin: "auto",
          // marginTop: "10%",
          // marginBottom: "10%",
          margin: "5vh 0vh",

          padding: "3%",
          // backgroundColor: '#e3eefc',
          backgroundColor: "white",
        }}
      >
        <Typography
          variant="body2"
          sx={{
            textAlign: "center",
            marginTop: "3%",
          }}
        >
          Your Product is Authentic!
        </Typography>
        <Box
          sx={{
            textAlign: "center",
            marginBottom: "5%",
          }}
        >
          <Typography
            variant="h2"
            sx={{
              textAlign: "center",
              marginBottom: "3%",
              fontFamily: "Gambetta",
              fontWeight: "bold",
              fontSize: "2.5rem",
            }}
          >
            Product Details
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              flex: 1,
              width: "100%",
              marginTop: "5%",
              marginBottom: "5%",
            }}
          >
            <Box
              sx={{
                marginRight: "1.5%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "center",
                flex: "0 0 35%",
                width: "35%",
              }}
            >
              <Avatar
                alt={name}
                src={image.filepreview}
                sx={{
                  width: 100,
                  height: 100,
                  margin: "auto",
                  marginBottom: "3%",
                  backgroundColor: "#3f51b5",
                }}
              >
                {name}
              </Avatar>
            </Box>
            <Box
              sx={{
                marginLeft: "1.5%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "left",
                flex: "0 0 65%",
                width: "65%",
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  textAlign: "left",
                  marginBottom: "5%",
                }}
              >
                {name}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  textAlign: "left",
                  marginBottom: "3%",
                }}
              >
                Serial Number: {serialNumber}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  textAlign: "left",
                  marginBottom: "3%",
                }}
              >
                Description: {description}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  textAlign: "left",
                  marginBottom: "3%",
                }}
              >
                Brand: {brand}
              </Typography>
            </Box>
          </Box>

          <Timeline
            sx={{
              [`& .${timelineOppositeContentClasses.root}`]: {
                flex: 0.2,
              },
            }}
          >
            {getHistory()}
            <TimelineItem>
              <TimelineOppositeContent color="textSecondary">
                {dayjs().format("HH:mm a")} {dayjs().format("MM/DD/YYYY")}
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot />
              </TimelineSeparator>
              <TimelineContent sx={{ py: "12px", px: 2 }}>
                <Typography>isSold: {isSold.toString()}</Typography>
              </TimelineContent>
            </TimelineItem>
          </Timeline>

          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Button
              onClick={handleBack}
              sx={{
                marginTop: "5%",
              }}
            >
              Back
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Product;
