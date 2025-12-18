import React from "react";

function PropertyCard({ property }) {
  return (
    <div className="card">
      <img src={property.images[0]} alt={property.title} />
      <div className="price">
        AED {property.price} <span className="verified"></span>
      </div>
      <div className="badge">
        <span>{property.bedrooms}</span>
        <span>{property.bathrooms}</span>
        <span>{property.size}</span>
      </div>
      <h3>{property.title}</h3>
      <div className="badge">Premium</div>
    </div>
  );
}

export default PropertyCard;
